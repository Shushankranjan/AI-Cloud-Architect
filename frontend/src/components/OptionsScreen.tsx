"use client";

import { useState } from "react";
import type { GenerateResponse } from "@/lib/types";
import { COMPLEXITY_LABELS, PARADIGM_LABELS, costRange } from "@/lib/format";
import { ConstraintsPanel } from "./ConstraintsPanel";
import { OptionCard } from "./OptionCard";
import { Button, Card, Icon, SectionTitle, cx } from "./ui";

export function OptionsScreen({
  generated,
  busy,
  onSelect,
  onRefine,
}: {
  generated: GenerateResponse;
  busy: boolean;
  onSelect: (optionId: string) => void;
  onRefine: () => void;
}) {
  const [showTable, setShowTable] = useState(false);
  const { options, recommendation, constraints } = generated;
  const recommended = options.find((o) => o.id === recommendation.selected_option_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            3 architecture options
          </h2>
          <p className="text-sm text-slate-500">
            Pick one to generate its diagram and analysis — or refine the requirements.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowTable((v) => !v)}>
            <Icon name="Columns2" />
            {showTable ? "Hide comparison" : "Compare side-by-side"}
          </Button>
          <Button variant="secondary" onClick={onRefine}>
            <Icon name="PencilLine" />
            Modify requirements
          </Button>
        </div>
      </div>

      <ConstraintsPanel constraints={constraints} />

      <Card className="border-sky-500/30 bg-sky-500/[0.03] p-5">
        <SectionTitle className="text-sky-400">AI recommendation</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {recommendation.rationale}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {recommendation.why_not_others.map((w) => {
            const other = options.find((o) => o.id === w.option_id);
            return (
              <details key={w.option_id} className="group rounded-lg bg-slate-950/50 px-3 py-2">
                <summary className="cursor-pointer list-none text-xs font-medium text-slate-400 group-open:text-slate-200">
                  Why not “{other?.name ?? w.option_id}”?
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{w.reason}</p>
              </details>
            );
          })}
        </div>
      </Card>

      {showTable && (
        <Card className="overflow-x-auto p-5">
          <SectionTitle>Side-by-side comparison</SectionTitle>
          <table className="mt-3 w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-2 pr-4 font-medium">Criterion</th>
                {options.map((o) => (
                  <th key={o.id} className="py-2 pr-4 font-semibold text-slate-300">
                    {o.name}
                    {o.id === recommendation.selected_option_id && (
                      <span className="ml-1 text-sky-400">★</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              <Row label="Paradigm" values={options.map((o) => PARADIGM_LABELS[o.paradigm])} />
              <Row
                label="Monthly cost"
                values={options.map((o) =>
                  costRange(
                    o.estimated_monthly_cost_usd.total_low,
                    o.estimated_monthly_cost_usd.total_high,
                  ),
                )}
              />
              <Row
                label="Ops complexity"
                values={options.map((o) => COMPLEXITY_LABELS[o.operational_complexity])}
              />
              <Row label="Time to deploy" values={options.map((o) => o.time_to_deploy)} />
              <Row label="Scalability" values={options.map((o) => o.scalability_ceiling)} />
              <Row label="Security" values={options.map((o) => o.security_posture)} />
              <Row label="Services" values={options.map((o) => `${o.services.length} services`)} />
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            recommended={option.id === recommendation.selected_option_id}
            busy={busy}
            onSelect={onSelect}
          />
        ))}
      </div>

      {recommended && (
        <p className="text-center text-xs text-slate-600">
          Not sure? “{recommended.name}” is the AI&apos;s pick for your constraints.
        </p>
      )}
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="py-2.5 pr-4 font-medium text-slate-400">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={cx("py-2.5 pr-4 text-slate-300")}>
          {v}
        </td>
      ))}
    </tr>
  );
}
