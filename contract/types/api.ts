export type AppType =
  | "web_app"
  | "api_backend"
  | "mobile_backend"
  | "data_pipeline"
  | "iot"
  | "ml_workload"
  | "other";

export type ExpectedUsers =
  | "under_1k"
  | "1k_10k"
  | "10k_100k"
  | "100k_1m"
  | "over_1m";

export type DataSensitivity = "none" | "pii" | "financial" | "health";

export type BudgetTier = "lean" | "standard" | "growth" | "scale";

export type ComplianceFramework = "gdpr" | "hipaa" | "pci_dss" | "soc2";

export interface RequirementsInput {
  description: string;
  app_type?: AppType | null;
  expected_users?: ExpectedUsers | null;
  data_sensitivity?: DataSensitivity | null;
  budget_tier?: BudgetTier | null;
  compliance?: ComplianceFramework[] | null;
  region_preference?: string | null;
}

export interface ExamplePrompt {
  id: string;
  title: string;
  description: string;
}

export type TrafficProfile = "low" | "medium" | "high" | "very_high";
export type DataType = "relational" | "document" | "blob" | "stream" | "mixed";
export type LatencySensitivity = "relaxed" | "standard" | "real_time";

export interface Constraints {
  traffic_profile: TrafficProfile;
  data_type: DataType;
  latency_sensitivity: LatencySensitivity;
  compliance: string[];
  budget_tier: BudgetTier;
  region: string;
  extracted_facts: string[];
  ambiguities: string[];
}

export type ServiceCategory =
  | "compute"
  | "storage"
  | "database"
  | "networking"
  | "security"
  | "monitoring"
  | "integration"
  | "cdn"
  | "auth"
  | "other";

export interface ServiceSpec {
  name: string;
  role: string;
  category: ServiceCategory;
}

export interface CostLineItem {
  category: string;
  low: number;
  high: number;
  notes?: string | null;
}

export interface CostEstimate {
  total_low: number;
  total_high: number;
  breakdown: CostLineItem[];
  assumptions: string[];
}

export interface Tradeoffs {
  pros: string[];
  cons: string[];
  best_when: string;
}

export type Paradigm = "serverless" | "container" | "traditional" | "hybrid";
export type Complexity = "low" | "medium" | "high";

export interface ArchitectureOption {
  id: string;
  name: string;
  paradigm: Paradigm;
  summary: string;
  services: ServiceSpec[];
  rationale: string;
  tradeoffs: Tradeoffs;
  estimated_monthly_cost_usd: CostEstimate;
  operational_complexity: Complexity;
  scalability_ceiling: string;
  security_posture: string;
  time_to_deploy: string;
}

export interface Recommendation {
  selected_option_id: string;
  rationale: string;
  why_not_others: { option_id: string; reason: string }[];
}

export interface GenerateResponse {
  session_id: string;
  version: number;
  constraints: Constraints;
  options: ArchitectureOption[];
  recommendation: Recommendation;
}

export interface Diagram {
  title: string;
  mermaid_source: string;
}

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityRisk {
  severity: RiskSeverity;
  description: string;
  mitigation: string;
}

export interface SecurityAnalysis {
  posture: string;
  risks: SecurityRisk[];
  compliance_notes: string[];
}

export interface ScalabilityAnalysis {
  bottlenecks: string[];
  strategy: string;
  mechanisms: string[];
  ceiling: string;
}

export interface Analysis {
  cost: {
    monthly_estimate_usd: CostEstimate;
    notes: string[];
  };
  security: SecurityAnalysis;
  scalability: ScalabilityAnalysis;
}

export interface SelectResponse {
  session_id: string;
  selected_option_id: string;
  diagram: Diagram;
  analysis: Analysis;
}

export type ChangeAction =
  | "add_service"
  | "remove_service"
  | "replace_service"
  | "modify_config";

export interface ProposedChange {
  id: string;
  action: ChangeAction;
  description: string;
  detail: string;
}

export interface ChatResponse {
  reply: string;
  proposed_changes: ProposedChange[];
  updated_diagram?: Diagram | null;
}

export interface RefineRequest {
  session_id: string;
  requirements: RequirementsInput;
}

export type ExportFormat = "markdown" | "mermaid" | "json";

export interface ExportResponse {
  format: ExportFormat;
  filename: string;
  content_type: string;
  content: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  version: number;
  created_at: string;
  requirements: RequirementsInput;
  constraints?: Constraints | null;
  options: ArchitectureOption[];
  recommendation?: Recommendation | null;
  selected_option_id?: string | null;
  diagram?: Diagram | null;
  analysis?: Analysis | null;
  chat_history: ChatMessage[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
