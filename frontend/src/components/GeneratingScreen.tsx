"use client";

import { useEffect, useState } from "react";
import { Card, cx } from "./ui";

const STEPS = [
  "Analyzing requirements",
  "Extracting technical constraints",
  "Generating 3 architecture options",
  "Comparing trade-offs",
  "Preparing recommendation",
];

export function GeneratingScreen() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-8">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute h-10 w-10 animate-ping rounded-full bg-sky-500/20" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-sky-500" />
          </div>
          <div>
            <div className="font-semibold text-slate-100">
              AI Architect is designing…
            </div>
            <div className="text-xs text-slate-500">
              This usually takes a few seconds
            </div>
          </div>
        </div>

        <ul className="mt-6 flex flex-col gap-3">
          {STEPS.map((step, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={cx(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    done && "border-emerald-500 bg-emerald-500/15 text-emerald-300",
                    current && "border-sky-500 bg-sky-500/15 text-sky-300",
                    !done && !current && "border-slate-700 text-slate-600",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={cx(
                    done && "text-slate-400",
                    current && "animate-pulse-step font-medium text-slate-100",
                    !done && !current && "text-slate-600",
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
