from __future__ import annotations

from app import llm
from app.prompts._shared import SYSTEM_PREAMBLE, constraints_block
from app.schemas import Analysis, ArchitectureOption, Constraints

SYSTEM = SYSTEM_PREAMBLE + """
Your task: analyse the selected AWS architecture across three dimensions.

Cost analysis:
- monthly_estimate_usd: realistic low/high total with a breakdown by category and explicit assumptions
  (e.g. "assumes 30% average CPU utilization", "assumes 100 GB data transfer out per month").
- notes: caveats and the biggest cost levers.

Security analysis:
- posture: one-sentence overall assessment.
- risks: concrete risks in THIS architecture (e.g. public S3 bucket, no WAF, missing encryption at rest),
  each with severity and a specific AWS mitigation (e.g. "enable S3 Block Public Access", "add WAF in front of ALB").
- compliance_notes: what the listed compliance frameworks require and how this design meets or gaps it.

Scalability analysis:
- bottlenecks: the components that hit their ceiling first, with rough numbers where defensible.
- strategy: horizontal vs vertical and why.
- mechanisms: the AWS-native autoscaling mechanisms in play (ASG, Lambda concurrency, DynamoDB on-demand, ...).
- ceiling: what breaks first and at roughly what scale.
"""


def run(option: ArchitectureOption, constraints: Constraints) -> Analysis:
    user_message = (
        f"Selected architecture option:\n{option.model_dump_json(indent=2)}\n\n"
        f"{constraints_block(constraints)}\n\n"
        "Produce the cost, security, and scalability analysis now."
    )
    return llm.generate_structured(
        system=SYSTEM,
        messages=[("user", user_message)],
        schema=Analysis,
    )
