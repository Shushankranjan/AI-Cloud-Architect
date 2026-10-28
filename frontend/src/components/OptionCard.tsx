"use client";

import { useState } from "react";
import type { ArchitectureOption } from "@/lib/types";
import {
  COMPLEXITY_LABELS,
  PARADIGM_LABELS,
  SERVICE_CATEGORY_LABELS,
  costRange,
} from "@/lib/format";
import { Badge, Button, Card, Icon, cx } from "./ui";

const paradigmTone: Record<string, "sky" | "emerald" | "amber" | "violet"> = {
  serverless: "sky",
  container: "emerald",
  traditional: "amber",
  hybrid: "violet",
};

export function OptionCard({
  option,
  recommended,
  busy,
  onSelect,
}: {
  option: ArchitectureOption;
  recommended: boolean;
  busy: boolean;
  onSelect: (optionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cost = option.estimated_monthly_cost_usd;

  return (
    <Card
      className={cx(
        "flex flex-col p-5 transition-colors",
        recommended && "border-sky-500/60 bg-sky-500/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100">{option.name}</h3>
            {recommended && <Badge tone="sky">★ Recommended</Badge>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={paradigmTone[option.paradigm] ?? "slate"}>
              {PARADIGM_LABELS[option.paradigm]}
            </Badge>
            <Badge tone="slate">Ops: {COMPLEXITY_LABELS[option.operational_complexity]}</Badge>
            <Badge tone="slate">{option.time_to_deploy}</Badge>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-300">{option.summary}</p>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
        <div className="text-xs text-slate-500">Estimated monthly cost</div>
        <div className="text-xl font-semibold text-emerald-300">
          {costRange(cost.total_low, cost.total_high)}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-slate-400">
          Services ({option.services.length})
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {option.services.map((svc) => (
            <span
              key={svc.name}
              title={`${SERVICE_CATEGORY_LABELS[svc.category]}: ${svc.role}`}
              className="cursor-default rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-300"
            >
              {svc.name.replace("Amazon ", "").replace("AWS ", "")}
            </span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 text-xs">
          <div>
            <div className="font-medium text-emerald-400">Pros</div>
            <ul className="mt-1 flex flex-col gap-1">
              {option.tradeoffs.pros.map((p) => (
                <li key={p} className="flex gap-1.5 text-slate-300">
                  <span className="text-emerald-400">+</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-rose-400">Cons</div>
            <ul className="mt-1 flex flex-col gap-1">
              {option.tradeoffs.cons.map((c) => (
                <li key={c} className="flex gap-1.5 text-slate-300">
                  <span className="text-rose-400">−</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-slate-400">Best when</div>
            <p className="mt-1 leading-relaxed text-slate-300">{option.tradeoffs.best_when}</p>
          </div>
          <div className="grid gap-2">
            <div className="rounded-md bg-slate-950/60 px-3 py-2">
              <span className="text-slate-500">Scalability: </span>
              <span className="text-slate-300">{option.scalability_ceiling}</span>
            </div>
            <div className="rounded-md bg-slate-950/60 px-3 py-2">
              <span className="text-slate-500">Security: </span>
              <span className="text-slate-300">{option.security_posture}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onSelect(option.id)}
            disabled={busy}
            variant={recommended ? "primary" : "secondary"}
            className="flex-1"
          >
            <Icon name="Check" />
            {busy ? "Loading…" : recommended ? "Use recommended" : "Select this"}
          </Button>
          <Button variant="ghost" onClick={() => setExpanded((v) => !v)}>
            <Icon
              name="ChevronDown"
              className={cx("transition-transform", expanded && "rotate-180")}
            />
            {expanded ? "Less" : "Details"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
