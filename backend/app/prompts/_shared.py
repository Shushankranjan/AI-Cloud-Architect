from __future__ import annotations

from app.schemas import Constraints, RequirementsInput

SYSTEM_PREAMBLE = """You are an expert AWS cloud architect working inside "AI Cloud Architect", \
a tool that designs production-ready AWS architectures for startups and solo developers.

Rules:
- Phase 1 scope is AWS only. Never recommend Azure or GCP services.
- Use real AWS service names only; never invent services.
- Cost estimates must be realistic monthly USD figures consistent with public AWS pricing.
- Always respond with JSON that exactly matches the required schema. No markdown fences, no commentary.
- Use only the exact enum values allowed by the schema.
"""


def requirements_block(requirements: RequirementsInput) -> str:
    return f"Project requirements (from the user):\n{requirements.model_dump_json(indent=2)}"


def constraints_block(constraints: Constraints) -> str:
    return f"Extracted constraints:\n{constraints.model_dump_json(indent=2)}"
