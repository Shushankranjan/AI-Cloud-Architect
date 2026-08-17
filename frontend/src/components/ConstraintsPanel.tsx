"use client";

import type { Constraints } from "@/lib/types";
import { BUDGET_TIER_LABELS, COMPLIANCE_LABELS, titleCase } from "@/lib/format";
import { Badge, Card, SectionTitle } from "./ui";

export function ConstraintsPanel({ constraints }: { constraints: Constraints }) {
  return (
    <Card className="p-5">
      <SectionTitle>Extracted constraints</SectionTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="sky">Traffic: {titleCase(constraints.traffic_profile)}</Badge>
        <Badge tone="sky">Data: {titleCase(constraints.data_type)}</Badge>
        <Badge tone="sky">Latency: {titleCase(constraints.latency_sensitivity)}</Badge>
        <Badge tone="violet">
          {constraints.compliance.length > 0
            ? constraints.compliance
                .map((c) => COMPLIANCE_LABELS[c] ?? c.toUpperCase())
                .join(", ")
            : "No compliance constraints"}
        </Badge>
        <Badge tone="emerald">
          Budget: {BUDGET_TIER_LABELS[constraints.budget_tier] ?? constraints.budget_tier}
        </Badge>
        <Badge tone="slate">Region: {constraints.region}</Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-slate-400">What the AI understood</div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {constraints.extracted_facts.map((fact) => (
              <li key={fact} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <span className="text-emerald-400">✓</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
        {constraints.ambiguities.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-400">Assumptions made</div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {constraints.ambiguities.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                  <span className="text-amber-400">!</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
