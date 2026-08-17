from __future__ import annotations

import logging

from app import llm
from app.llm_errors import LLMError
from app.mermaid_validator import validate_mermaid
from app.prompts._shared import SYSTEM_PREAMBLE, constraints_block
from app.schemas import ArchitectureOption, Constraints, Diagram

logger = logging.getLogger("architect.prompts.diagram")

SYSTEM = SYSTEM_PREAMBLE + """
Your task: produce a Mermaid diagram for the selected AWS architecture.

Strict syntax rules:
- The first line must be exactly "flowchart TB".
- Output must parse with the Mermaid.js parser on the first try.
- Node ids: short lowercase alphanumeric (e.g. alb, ecs, rds). Labels in square brackets, e.g. alb[Application Load Balancer].
- Edges use --> with optional quoted labels: alb --> |routes| ecs
- Group tiers with "subgraph <id> [<title>]" ... "end" blocks (e.g. a VPC subgraph). Every subgraph must be closed with "end".
- Include every service from the selected option. Keep the diagram under 25 nodes.
- No icons, no URLs, no "style" statements, no classDef, no click statements.
- Database nodes may use cylinder shape: rds[(RDS PostgreSQL)].
"""


def _user_message(option: ArchitectureOption, constraints: Constraints) -> str:
    return (
        f"Selected architecture option:\n{option.model_dump_json(indent=2)}\n\n"
        f"{constraints_block(constraints)}\n\n"
        "Generate the diagram now."
    )


def run(option: ArchitectureOption, constraints: Constraints) -> Diagram:
    """Generate a Mermaid diagram, self-healing on parser failure (PRD §11)."""
    system = SYSTEM
    messages: list[llm.Message] = [("user", _user_message(option, constraints))]
    retries = llm.get_max_retries()

    for attempt in range(retries + 1):
        diagram = llm.generate_structured(system=system, messages=messages, schema=Diagram)
        ok, error = validate_mermaid(diagram.mermaid_source)
        if ok:
            return diagram
        logger.warning(
            "generated mermaid failed validation",
            extra={"attempt": attempt + 1},
        )
        if attempt == retries:
            raise LLMError(
                "Generated Mermaid diagram failed validation after retries",
                code="mermaid_validation_failed",
                details={"error": error},
            )
        messages = messages + [
            ("model", diagram.mermaid_source),
            (
                "user",
                "Your Mermaid source failed to parse with this error:\n"
                f"{error}\nRe-emit the full corrected diagram JSON only.",
            ),
        ]

    raise LLMError("Unreachable", code="mermaid_validation_failed")


def heal(source: str, error: str, context: str) -> Diagram:
    """Targeted repair of an invalid diagram, used for chat-updated diagrams."""
    messages: list[llm.Message] = [
        (
            "user",
            f"Architecture context:\n{context}\n\n"
            "The following Mermaid source failed to parse:\n"
            f"{source}\n\nParser error:\n{error}\n\n"
            "Re-emit the full corrected diagram JSON only.",
        )
    ]
    return llm.generate_structured(system=SYSTEM, messages=messages, schema=Diagram)
