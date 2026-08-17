from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app import fixtures, llm
from app.prompts import analyse, chat as chat_prompt, diagram, extract_constraints, generate_options
from app.schemas import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    Constraints,
    ExportRequest,
    ExportResponse,
    GenerateResponse,
    RefineRequest,
    RequirementsInput,
    SelectRequest,
    SelectResponse,
    Session,
)

logger = logging.getLogger("architect.router")

router = APIRouter(prefix="/api/architect", tags=["architect"])


def _live() -> bool:
    return llm.get_mode() == "live"


def _session_or_404(session_id: str) -> Session:
    session = fixtures.get_session(session_id)
    if session is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "session_not_found",
                    "message": f"No session with id '{session_id}'",
                    "details": None,
                }
            },
        )
    return session


def _generate_live(requirements: RequirementsInput, session_id: str, version: int) -> GenerateResponse:
    constraints = extract_constraints.run(requirements)
    result = generate_options.run(requirements, constraints)
    return GenerateResponse(
        session_id=session_id,
        version=version,
        constraints=constraints,
        options=result.options,
        recommendation=result.recommendation,
    )


def _constraints_for(session: Session) -> Constraints:
    if session.constraints is not None:
        return session.constraints
    return extract_constraints.run(session.requirements)


@router.get("/examples")
def get_examples():
    return fixtures.load_examples()


@router.post("/generate", response_model=GenerateResponse)
def generate(requirements: RequirementsInput) -> GenerateResponse:
    session_id = fixtures.new_session_id()
    if _live():
        logger.info("live generate", extra={"session_id": session_id})
        generated = _generate_live(requirements, session_id, version=1)
    else:
        generated = fixtures.load_generate(session_id)
    fixtures.create_session(requirements, generated)
    return generated


@router.get("/session/{session_id}", response_model=Session)
def get_session(session_id: str) -> Session:
    return _session_or_404(session_id)


@router.post("/select", response_model=SelectResponse)
def select(request: SelectRequest) -> SelectResponse:
    session = _session_or_404(request.session_id)
    option = next((o for o in session.options if o.id == request.option_id), None)
    if option is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "option_not_found",
                    "message": f"No option with id '{request.option_id}' in session '{session.id}'",
                    "details": None,
                }
            },
        )
    if _live():
        logger.info("live select", extra={"session_id": session.id})
        constraints = _constraints_for(session)
        selected = SelectResponse(
            session_id=session.id,
            selected_option_id=option.id,
            diagram=diagram.run(option, constraints),
            analysis=analyse.run(option, constraints),
        )
    else:
        selected = fixtures.load_select(session.id, request.option_id)
    session.selected_option_id = request.option_id
    session.diagram = selected.diagram
    session.analysis = selected.analysis
    return selected


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    session = _session_or_404(request.session_id)
    if _live():
        logger.info("live chat", extra={"session_id": session.id})
        response = chat_prompt.run(session, request.message)
    else:
        reply = fixtures.load_chat_reply()
        response = ChatResponse.model_validate(reply)
    session.chat_history.append(
        ChatMessage(role="user", content=request.message, timestamp=datetime.now(timezone.utc))
    )
    session.chat_history.append(
        ChatMessage(role="assistant", content=response.reply, timestamp=datetime.now(timezone.utc))
    )
    if response.updated_diagram is not None:
        session.diagram = response.updated_diagram
    return response


@router.post("/refine", response_model=GenerateResponse)
def refine(request: RefineRequest) -> GenerateResponse:
    session = _session_or_404(request.session_id)
    session.version += 1
    if _live():
        logger.info("live refine", extra={"session_id": session.id})
        generated = _generate_live(request.requirements, session.id, session.version)
    else:
        generated = fixtures.load_refine(session.id, session.version)
    session.requirements = request.requirements
    session.constraints = generated.constraints
    session.options = generated.options
    session.recommendation = generated.recommendation
    session.selected_option_id = None
    session.diagram = None
    session.analysis = None
    return generated


@router.post("/export", response_model=ExportResponse)
def export(request: ExportRequest) -> ExportResponse:
    session = _session_or_404(request.session_id)
    if request.format == "markdown":
        return ExportResponse.model_validate(fixtures.load_export_markdown())
    if request.format == "mermaid":
        if session.diagram is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": {
                        "code": "no_diagram",
                        "message": "Select an architecture before exporting a diagram",
                        "details": None,
                    }
                },
            )
        return ExportResponse(
            format="mermaid",
            filename="architecture.mmd",
            content_type="text/plain",
            content=session.diagram.mermaid_source,
        )
    return ExportResponse(
        format="json",
        filename="architecture.json",
        content_type="application/json",
        content=json.dumps(session.model_dump(mode="json"), indent=2),
    )
