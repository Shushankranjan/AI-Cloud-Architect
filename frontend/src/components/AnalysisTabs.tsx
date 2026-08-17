"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types";
import { SEVERITY_ORDER, costRange, titleCase } from "@/lib/format";
import { Badge, Card, SectionTitle, cx } from "./ui";

type Tab = "cost" | "security" | "scalability";

const severityTone: Record<string, "rose" | "amber" | "sky" | "slate"> = {
  critical: "rose",
  high: "rose",
  medium: "amber",
  low: "slate",
};

export function AnalysisTabs({ analysis }: { analysis: Analysis }) {
  const [tab, setTab] = useState<Tab>("cost");

  return (
    <Card className="p-5">
      <div className="flex gap-1 rounded-lg bg-slate-950/70 p-1">
        {(["cost", "security", "scalability"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-slate-800 text-slate-100"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {titleCase(t)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "cost" && <CostTab analysis={analysis} />}
        {tab === "security" && <SecurityTab analysis={analysis} />}
        {tab === "scalability" && <ScalabilityTab analysis={analysis} />}
      </div>
    </Card>
  );
}

function CostTab({ analysis }: { analysis: Analysis }) {
  const est = analysis.cost.monthly_estimate_usd;
  const max = Math.max(...est.breakdown.map((b) => b.high), 1);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-emerald-300">
          {costRange(est.total_low, est.total_high)}
        </span>
        <span className="text-xs text-slate-500">estimated, on-demand pricing</span>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {est.breakdown.map((line) => (
          <div key={line.category}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">{titleCase(line.category)}</span>
              <span className="text-slate-400">
                ${line.low}–${line.high}
                {line.notes && <span className="ml-2 text-slate-600">{line.notes}</span>}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-500/70"
                style={{ width: `${(line.high / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {est.assumptions.length > 0 && (
        <div className="mt-4 rounded-lg bg-slate-950/60 p-3">
          <div className="text-xs font-medium text-slate-400">Assumptions</div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {est.assumptions.map((a) => (
              <li key={a} className="text-xs text-slate-500">
                · {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.cost.notes.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {analysis.cost.notes.map((n) => (
            <li key={n} className="flex gap-2 text-xs leading-relaxed text-slate-300">
              <span className="text-sky-400">→</span>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SecurityTab({ analysis }: { analysis: Analysis }) {
  const risks = [...analysis.security.risks].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-300">{analysis.security.posture}</p>

      <SectionTitle className="mt-5">Identified risks</SectionTitle>
      <div className="mt-2 flex flex-col gap-2">
        {risks.map((risk) => (
          <div key={risk.description} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2">
              <Badge tone={severityTone[risk.severity]}>{titleCase(risk.severity)}</Badge>
              <span className="text-xs text-slate-300">{risk.description}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              <span className="font-medium text-emerald-400">Mitigation: </span>
              {risk.mitigation}
            </p>
          </div>
        ))}
      </div>

      {analysis.security.compliance_notes.length > 0 && (
        <>
          <SectionTitle className="mt-5">Compliance notes</SectionTitle>
          <ul className="mt-2 flex flex-col gap-1.5">
            {analysis.security.compliance_notes.map((note) => (
              <li key={note} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <span className="text-violet-400">§</span>
                {note}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ScalabilityTab({ analysis }: { analysis: Analysis }) {
  const s = analysis.scalability;
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="text-xs font-medium text-slate-400">Strategy</div>
        <p className="mt-1 text-sm leading-relaxed text-slate-200">{s.strategy}</p>
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-amber-300">Ceiling:</span> {s.ceiling}
        </p>
      </div>

      <div>
        <SectionTitle>Bottlenecks to watch</SectionTitle>
        <ul className="mt-2 flex flex-col gap-1.5">
          {s.bottlenecks.map((b) => (
            <li key={b} className="flex gap-2 text-xs leading-relaxed text-slate-300">
              <span className="text-rose-400">▲</span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SectionTitle>Scaling mechanisms</SectionTitle>
        <ul className="mt-2 flex flex-col gap-1.5">
          {s.mechanisms.map((m) => (
            <li key={m} className="flex gap-2 text-xs leading-relaxed text-slate-300">
              <span className="text-emerald-400">⚙</span>
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
