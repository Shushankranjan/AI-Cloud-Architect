from __future__ import annotations

from app import llm
from app.prompts._shared import SYSTEM_PREAMBLE, requirements_block
from app.schemas import Constraints, RequirementsInput

SYSTEM = SYSTEM_PREAMBLE + """
Your task: extract canonical technical constraints from the user's project requirements.

Guidance:
- traffic_profile: infer from expected users and traffic descriptions.
- data_type: relational / document / blob / stream / mixed.
- latency_sensitivity: relaxed / standard / real_time.
- compliance: subset of ["gdpr", "hipaa", "pci_dss", "soc2"]; empty list if none apply.
- budget_tier mapping: lean = under $50/mo, standard = $50-$500/mo, growth = $500-$5k/mo, scale = over $5k/mo.
- region: the AWS region the user mentioned (e.g. "eu-central-1"); default to "us-east-1" when unspecified.
- extracted_facts: 3-6 short factual statements from the input that drive your architecture decisions.
- ambiguities: anything missing or unclear that you had to assume; empty list if the input is complete.
"""


def run(requirements: RequirementsInput) -> Constraints:
    user_message = (
        f"{requirements_block(requirements)}\n\n"
        "Extract the constraints now."
    )
    return llm.generate_structured(
        system=SYSTEM,
        messages=[("user", user_message)],
        schema=Constraints,
    )
