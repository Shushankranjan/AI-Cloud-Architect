import type {
  AppType,
  BudgetTier,
  Complexity,
  DataSensitivity,
  ExpectedUsers,
  Paradigm,
  RiskSeverity,
  ServiceCategory,
} from "./types";

export function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function costRange(low: number, high: number): string {
  return `${usd(low)}–${usd(high)}/mo`;
}

export const APP_TYPE_LABELS: Record<AppType, string> = {
  web_app: "Web app",
  api_backend: "API backend",
  mobile_backend: "Mobile backend",
  data_pipeline: "Data pipeline",
  iot: "IoT",
  ml_workload: "ML workload",
  other: "Other",
};

export const EXPECTED_USERS_LABELS: Record<ExpectedUsers, string> = {
  under_1k: "< 1k users",
  "1k_10k": "1k–10k users",
  "10k_100k": "10k–100k users",
  "100k_1m": "100k–1M users",
  over_1m: "> 1M users",
};

export const DATA_SENSITIVITY_LABELS: Record<DataSensitivity, string> = {
  none: "None",
  pii: "PII",
  financial: "Financial",
  health: "Health (PHI)",
};

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  lean: "Lean (< $50/mo)",
  standard: "Standard ($50–500/mo)",
  growth: "Growth ($500–5k/mo)",
  scale: "Scale (> $5k/mo)",
};

export const COMPLIANCE_LABELS: Record<string, string> = {
  gdpr: "GDPR",
  hipaa: "HIPAA",
  pci_dss: "PCI-DSS",
  soc2: "SOC 2",
};

export const PARADIGM_LABELS: Record<Paradigm, string> = {
  serverless: "Serverless",
  container: "Containers",
  traditional: "Traditional",
  hybrid: "Hybrid",
};

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  compute: "Compute",
  storage: "Storage",
  database: "Database",
  networking: "Networking",
  security: "Security",
  monitoring: "Monitoring",
  integration: "Integration",
  cdn: "CDN / Edge",
  auth: "Auth",
  other: "Other",
};

export const SEVERITY_ORDER: Record<RiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
