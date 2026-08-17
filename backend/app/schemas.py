from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class AppType(str, Enum):
    web_app = "web_app"
    api_backend = "api_backend"
    mobile_backend = "mobile_backend"
    data_pipeline = "data_pipeline"
    iot = "iot"
    ml_workload = "ml_workload"
    other = "other"


class ExpectedUsers(str, Enum):
    under_1k = "under_1k"
    users_1k_10k = "1k_10k"
    users_10k_100k = "10k_100k"
    users_100k_1m = "100k_1m"
    over_1m = "over_1m"


class DataSensitivity(str, Enum):
    none = "none"
    pii = "pii"
    financial = "financial"
    health = "health"


class BudgetTier(str, Enum):
    lean = "lean"
    standard = "standard"
    growth = "growth"
    scale = "scale"


class ComplianceFramework(str, Enum):
    gdpr = "gdpr"
    hipaa = "hipaa"
    pci_dss = "pci_dss"
    soc2 = "soc2"


class RequirementsInput(BaseModel):
    description: str = Field(min_length=20, max_length=5000)
    app_type: AppType | None = None
    expected_users: ExpectedUsers | None = None
    data_sensitivity: DataSensitivity | None = None
    budget_tier: BudgetTier | None = None
    compliance: list[ComplianceFramework] | None = None
    region_preference: str | None = None


class ExamplePrompt(BaseModel):
    id: str
    title: str
    description: str


class TrafficProfile(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    very_high = "very_high"


class DataType(str, Enum):
    relational = "relational"
    document = "document"
    blob = "blob"
    stream = "stream"
    mixed = "mixed"


class LatencySensitivity(str, Enum):
    relaxed = "relaxed"
    standard = "standard"
    real_time = "real_time"


class Constraints(BaseModel):
    traffic_profile: TrafficProfile
    data_type: DataType
    latency_sensitivity: LatencySensitivity
    compliance: list[str]
    budget_tier: BudgetTier
    region: str
    extracted_facts: list[str]
    ambiguities: list[str]


class ServiceCategory(str, Enum):
    compute = "compute"
    storage = "storage"
    database = "database"
    networking = "networking"
    security = "security"
    monitoring = "monitoring"
    integration = "integration"
    cdn = "cdn"
    auth = "auth"
    other = "other"


class ServiceSpec(BaseModel):
    name: str
    role: str
    category: ServiceCategory


class CostLineItem(BaseModel):
    category: str
    low: float
    high: float
    notes: str | None = None


class CostEstimate(BaseModel):
    total_low: float
    total_high: float
    breakdown: list[CostLineItem]
    assumptions: list[str]


class Tradeoffs(BaseModel):
    pros: list[str]
    cons: list[str]
    best_when: str


class Paradigm(str, Enum):
    serverless = "serverless"
    container = "container"
    traditional = "traditional"
    hybrid = "hybrid"


class Complexity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ArchitectureOption(BaseModel):
    id: str
    name: str
    paradigm: Paradigm
    summary: str
    services: list[ServiceSpec]
    rationale: str
    tradeoffs: Tradeoffs
    estimated_monthly_cost_usd: CostEstimate
    operational_complexity: Complexity
    scalability_ceiling: str
    security_posture: str
    time_to_deploy: str


class WhyNotOther(BaseModel):
    option_id: str
    reason: str


class Recommendation(BaseModel):
    selected_option_id: str
    rationale: str
    why_not_others: list[WhyNotOther]


class GenerateResponse(BaseModel):
    session_id: str
    version: int
    constraints: Constraints
    options: list[ArchitectureOption] = Field(min_length=3, max_length=3)
    recommendation: Recommendation


class SelectRequest(BaseModel):
    session_id: str
    option_id: str


class RiskSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class SecurityRisk(BaseModel):
    severity: RiskSeverity
    description: str
    mitigation: str


class SecurityAnalysis(BaseModel):
    posture: str
    risks: list[SecurityRisk]
    compliance_notes: list[str]


class ScalabilityAnalysis(BaseModel):
    bottlenecks: list[str]
    strategy: str
    mechanisms: list[str]
    ceiling: str


class CostAnalysis(BaseModel):
    monthly_estimate_usd: CostEstimate
    notes: list[str]


class Analysis(BaseModel):
    cost: CostAnalysis
    security: SecurityAnalysis
    scalability: ScalabilityAnalysis


class Diagram(BaseModel):
    title: str
    mermaid_source: str


class SelectResponse(BaseModel):
    session_id: str
    selected_option_id: str
    diagram: Diagram
    analysis: Analysis


class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=2000)


class ChangeAction(str, Enum):
    add_service = "add_service"
    remove_service = "remove_service"
    replace_service = "replace_service"
    modify_config = "modify_config"


class ProposedChange(BaseModel):
    id: str
    action: ChangeAction
    description: str
    detail: str


class ChatResponse(BaseModel):
    reply: str
    proposed_changes: list[ProposedChange]
    updated_diagram: Diagram | None = None


class RefineRequest(BaseModel):
    session_id: str
    requirements: RequirementsInput


class ExportFormat(str, Enum):
    markdown = "markdown"
    mermaid = "mermaid"
    json = "json"


class ExportRequest(BaseModel):
    session_id: str
    format: ExportFormat


class ExportResponse(BaseModel):
    format: ExportFormat
    filename: str
    content_type: str
    content: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime


class Session(BaseModel):
    id: str
    version: int
    created_at: datetime
    requirements: RequirementsInput
    constraints: Constraints | None = None
    options: list[ArchitectureOption] = []
    recommendation: Recommendation | None = None
    selected_option_id: str | None = None
    diagram: Diagram | None = None
    analysis: Analysis | None = None
    chat_history: list[ChatMessage] = []


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
    mode: Literal["stub", "live"]


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: object | None = None


class ApiError(BaseModel):
    error: ErrorDetail
