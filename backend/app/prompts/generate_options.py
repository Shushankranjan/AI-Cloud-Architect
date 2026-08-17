from __future__ import annotations

from pydantic import BaseModel, Field

from app import llm
from app.prompts._shared import SYSTEM_PREAMBLE, constraints_block, requirements_block
from app.schemas import (
    ArchitectureOption,
    Constraints,
    Recommendation,
    RequirementsInput,
)


class OptionsAndRecommendation(BaseModel):
    options: list[ArchitectureOption] = Field(min_length=3, max_length=3)
    recommendation: Recommendation


SYSTEM = SYSTEM_PREAMBLE + """
Your task: design exactly 3 distinct AWS architectures for the requirements, one per paradigm:

1. id "opt-serverless", paradigm "serverless" — e.g. Lambda, API Gateway, DynamoDB, EventBridge, Cognito.
2. id "opt-container", paradigm "container" — e.g. ECS Fargate, ALB, RDS, ElastiCache, ECR.
3. id "opt-traditional", paradigm "traditional" — e.g. EC2 with ASG, ALB, RDS, S3.

For each option provide:
- name: short descriptive title.
- summary: one-sentence pitch.
- services: 5-10 real AWS services, each with a concrete role and category.
- rationale: 2-3 sentences on why this paradigm fits.
- tradeoffs: 3-5 pros, 3-5 cons, and a "best when" sentence.
- estimated_monthly_cost_usd: realistic low/high range with a breakdown by category \
(compute, storage, database, networking, monitoring, ...) and explicit assumptions.
- operational_complexity, scalability_ceiling, security_posture, time_to_deploy.

Then the recommendation:
- selected_option_id must be one of the three option ids.
- rationale: 2-3 paragraphs citing the specific constraints that drove the choice.
- why_not_others: one entry for each rejected option explaining why it loses for THESE constraints.
"""


def run(requirements: RequirementsInput, constraints: Constraints) -> OptionsAndRecommendation:
    user_message = (
        f"{requirements_block(requirements)}\n\n"
        f"{constraints_block(constraints)}\n\n"
        "Generate the 3 architecture options and the recommendation now."
    )
    return llm.generate_structured(
        system=SYSTEM,
        messages=[("user", user_message)],
        schema=OptionsAndRecommendation,
    )
