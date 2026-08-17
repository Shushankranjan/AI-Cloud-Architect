"use client";

import { useState } from "react";
import type {
  AppType,
  BudgetTier,
  ComplianceFramework,
  DataSensitivity,
  ExamplePrompt,
  ExpectedUsers,
  RequirementsInput,
} from "@/lib/types";
import {
  APP_TYPE_LABELS,
  BUDGET_TIER_LABELS,
  COMPLIANCE_LABELS,
  DATA_SENSITIVITY_LABELS,
  EXPECTED_USERS_LABELS,
} from "@/lib/format";
import { Button, Card, SectionTitle, cx } from "./ui";

const selectClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500";

export function RequirementsForm({
  examples,
  initial,
  busy,
  error,
  submitLabel,
  onSubmit,
}: {
  examples: ExamplePrompt[];
  initial?: RequirementsInput | null;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (req: RequirementsInput) => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [appType, setAppType] = useState<AppType | "">(initial?.app_type ?? "");
  const [expectedUsers, setExpectedUsers] = useState<ExpectedUsers | "">(
    initial?.expected_users ?? "",
  );
  const [sensitivity, setSensitivity] = useState<DataSensitivity | "">(
    initial?.data_sensitivity ?? "",
  );
  const [budget, setBudget] = useState<BudgetTier | "">(initial?.budget_tier ?? "");
  const [compliance, setCompliance] = useState<ComplianceFramework[]>(
    initial?.compliance ?? [],
  );
  const [region, setRegion] = useState(initial?.region_preference ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  function toggleCompliance(value: ComplianceFramework) {
    setCompliance((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  }

  function handleSubmit() {
    if (description.trim().length < 20) {
      setLocalError("Please describe your project in at least 20 characters.");
      return;
    }
    setLocalError(null);
    onSubmit({
      description: description.trim(),
      app_type: appType || null,
      expected_users: expectedUsers || null,
      data_sensitivity: sensitivity || null,
      budget_tier: budget || null,
      compliance: compliance.length > 0 ? compliance : null,
      region_preference: region.trim() || null,
    });
  }

  const shownError = localError ?? error;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="p-6">
        <SectionTitle>Project requirements</SectionTitle>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={7}
          placeholder="Describe what you're building, who will use it, and any constraints…

Example: I'm building a project management SaaS for small teams. Expect ~5,000 users in the EU in the first year. Must be GDPR compliant. Budget under $500/month."
          className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 outline-none focus:border-sky-500"
        />
        <div className="mt-1 text-right text-xs text-slate-600">
          {description.trim().length} characters
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-slate-400">App type</span>
            <select
              value={appType}
              onChange={(e) => setAppType(e.target.value as AppType | "")}
              className={cx(selectClass, "mt-1")}
            >
              <option value="">Not sure</option>
              {Object.entries(APP_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-slate-400">Expected users (year 1)</span>
            <select
              value={expectedUsers}
              onChange={(e) => setExpectedUsers(e.target.value as ExpectedUsers | "")}
              className={cx(selectClass, "mt-1")}
            >
              <option value="">Not sure</option>
              {Object.entries(EXPECTED_USERS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-slate-400">Data sensitivity</span>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value as DataSensitivity | "")}
              className={cx(selectClass, "mt-1")}
            >
              <option value="">Not sure</option>
              {Object.entries(DATA_SENSITIVITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-slate-400">Monthly budget</span>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value as BudgetTier | "")}
              className={cx(selectClass, "mt-1")}
            >
              <option value="">Not sure</option>
              {Object.entries(BUDGET_TIER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <span className="text-xs text-slate-400">Compliance requirements</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(COMPLIANCE_LABELS).map(([value, label]) => {
              const active = compliance.includes(value as ComplianceFramework);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleCompliance(value as ComplianceFramework)}
                  className={cx(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-sky-500 bg-sky-500/15 text-sky-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs text-slate-400">
            Region preference <span className="text-slate-600">(optional)</span>
          </span>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. eu-central-1, us-east-1, or 'EU only'"
            className={cx(selectClass, "mt-1")}
          />
        </label>

        {shownError && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {shownError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            The AI extracts constraints, then drafts 3 architectures.
          </p>
          <Button onClick={handleSubmit} disabled={busy} className="px-6 py-2.5">
            {busy ? "Working…" : submitLabel}
          </Button>
        </div>
      </Card>

      <div>
        <SectionTitle className="mb-3">Or start from an example</SectionTitle>
        <div className="flex flex-col gap-3">
          {examples.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setDescription(ex.description)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left transition-colors hover:border-sky-500/50 hover:bg-slate-900"
            >
              <div className="text-sm font-semibold text-slate-200">{ex.title}</div>
              <div className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                {ex.description}
              </div>
            </button>
          ))}
          {examples.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-800 p-4 text-xs text-slate-600">
              Examples unavailable — is the backend running?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
