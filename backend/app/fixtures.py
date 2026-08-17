from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.schemas import (
    Analysis,
    ArchitectureOption,
    ChatMessage,
    Constraints,
    Diagram,
    ExamplePrompt,
    GenerateResponse,
    Recommendation,
    RequirementsInput,
    SelectResponse,
    Session,
)

def _find_fixture_dir() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "contract" / "fixtures"
        if candidate.is_dir():
            return candidate
    raise RuntimeError("contract/fixtures directory not found")


FIXTURE_DIR = _find_fixture_dir()

_sessions: dict[str, Session] = {}


def _load(name: str) -> dict:
    return json.loads((FIXTURE_DIR / name).read_text(encoding="utf-8"))


def load_examples() -> list[ExamplePrompt]:
    return [ExamplePrompt.model_validate(item) for item in _load("examples.json")]


def load_generate(session_id: str) -> GenerateResponse:
    data = _load("generate_response.json")
    data["session_id"] = session_id
    return GenerateResponse.model_validate(data)


def load_refine(session_id: str, version: int) -> GenerateResponse:
    data = _load("refine_response.json")
    data["session_id"] = session_id
    data["version"] = version
    return GenerateResponse.model_validate(data)


def load_select(session_id: str, option_id: str) -> SelectResponse:
    data = _load("select_response.json")
    data["session_id"] = session_id
    data["selected_option_id"] = option_id
    return SelectResponse.model_validate(data)


def load_chat_reply() -> dict:
    return _load("chat_response.json")


def load_export_markdown() -> dict:
    return _load("export_markdown.json")


def create_session(requirements: RequirementsInput, generated: GenerateResponse) -> Session:
    session = Session(
        id=generated.session_id,
        version=generated.version,
        created_at=datetime.now(timezone.utc),
        requirements=requirements,
        constraints=generated.constraints,
        options=generated.options,
        recommendation=generated.recommendation,
    )
    _sessions[session.id] = session
    return session


def get_session(session_id: str) -> Session | None:
    return _sessions.get(session_id)


def new_session_id() -> str:
    return f"sess_{uuid4().hex[:12]}"


def reset() -> None:
    _sessions.clear()
