from __future__ import annotations

import logging

from app import llm
from app.mermaid_validator import validate_mermaid
from app.prompts import diagram as diagram_prompt
from app.prompts._shared import SYSTEM_PREAMBLE
from app.schemas import ChatResponse, Session

logger = logging.getLogger("architect.prompts.chat")

MAX_HISTORY_MESSAGES = 12

SYSTEM = SYSTEM_PREAMBLE + """
You are the AI Architect Chat. You answer questions about the CURRENT architecture in the session \
and suggest concrete modifications.

Rules:
- Be concrete and concise (under 250 words unless the user asks for detail).
- Ground every claim in the session context (requirements, constraints, selected option, current diagram).
- If the user's request implies architecture changes, return proposed_changes with concrete actions:
  add_service / remove_service / replace_service / modify_config, with ids "chg-1", "chg-2", ...
- Set updated_diagram ONLY when the architecture materially changes. It must be the FULL updated
  Mermaid diagram starting with "flowchart TB", not a fragment, and must parse with Mermaid.js.
- If you are only answering a question, proposed_changes must be empty and updated_diagram must be null.
"""


def _context_block(session: Session) -> str:
    selected = next(
        (option for option in session.options if option.id == session.selected_option_id),
        None,
    )
    parts = [f"Requirements:\n{session.requirements.model_dump_json(indent=2)}"]
    if session.constraints is not None:
        parts.append(f"Constraints:\n{session.constraints.model_dump_json(indent=2)}")
    if selected is not None:
        parts.append(f"Selected architecture option:\n{selected.model_dump_json(indent=2)}")
    if session.diagram is not None:
        parts.append(f"Current Mermaid diagram:\n{session.diagram.mermaid_source}")
    return "\n\n".join(parts)


def _history_block(session: Session) -> str:
    recent = session.chat_history[-MAX_HISTORY_MESSAGES:]
    if not recent:
        return "(no conversation yet)"
    lines = [f"{message.role}: {message.content}" for message in recent]
    return "\n".join(lines)


def run(session: Session, message: str) -> ChatResponse:
    context = _context_block(session)
    user_message = (
        f"Session context:\n{context}\n\n"
        f"Conversation so far:\n{_history_block(session)}\n\n"
        f"user: {message}\n\nRespond as the architect now."
    )
    response = llm.generate_structured(
        system=SYSTEM,
        messages=[("user", user_message)],
        schema=ChatResponse,
    )

    if response.updated_diagram is not None:
        ok, error = validate_mermaid(response.updated_diagram.mermaid_source)
        if not ok:
            logger.warning("chat updated_diagram failed validation, attempting heal")
            try:
                healed = diagram_prompt.heal(
                    response.updated_diagram.mermaid_source, error or "unknown parse error", context
                )
                healed_ok, healed_error = validate_mermaid(healed.mermaid_source)
                if healed_ok:
                    response.updated_diagram = healed
                else:
                    raise ValueError(healed_error)
            except Exception:
                logger.warning("dropping invalid updated_diagram from chat response")
                response.updated_diagram = None
                response.reply += (
                    "\n\nNote: I drafted a diagram update but it failed validation, "
                    "so I left the current diagram unchanged."
                )

    return response
