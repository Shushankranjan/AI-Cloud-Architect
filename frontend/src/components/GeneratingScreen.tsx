"use client";

import { useEffect, useRef, useState } from "react";
import { Card, cx } from "./ui";

type LogKind = "thinking" | "evaluate" | "compare" | "design" | "estimate" | "decision";

type ScriptEntry = {
  kind: LogKind;
  text: string;
  durationMs: number;
};

const SCRIPT: ScriptEntry[] = [
  { kind: "thinking", text: "Reading your requirements…", durationMs: 1400 },
  { kind: "thinking", text: "Identifying workload type, scale, and data sensitivity.", durationMs: 1800 },
  { kind: "evaluate", text: "Evaluating 3 architectural paradigms against your constraints.", durationMs: 2200 },
  { kind: "compare",  text: "Comparing serverless vs. containers vs. EC2/RDS.", durationMs: 2000 },
  { kind: "design",   text: "Drafting compute, storage, networking, and security layers.", durationMs: 2400 },
  { kind: "estimate", text: "Estimating monthly cost for your traffic profile.", durationMs: 1800 },
  { kind: "thinking", text: "Weighing trade-offs: cost vs. scalability vs. ops complexity.", durationMs: 2200 },
  { kind: "decision", text: "Selecting a recommended architecture and writing rationale.", durationMs: 2000 },
  { kind: "design",   text: "Building the Mermaid diagram and analysis sections.", durationMs: 2200 },
];

const TAIL_TEXTS = [
  "Still working — finalizing the recommendation…",
  "Polishing the diagram and analysis…",
  "Almost there — last pass on cost and security…",
];

const KIND_STYLES: Record<LogKind, { prefix: string; tone: string; color: string }> = {
  thinking: { prefix: "›", tone: "Analyzing",  color: "text-sky-300" },
  evaluate: { prefix: "◇", tone: "Evaluating", color: "text-violet-300" },
  compare:  { prefix: "⇄", tone: "Comparing",  color: "text-amber-300" },
  design:   { prefix: "▣", tone: "Designing",  color: "text-emerald-300" },
  estimate: { prefix: "$", tone: "Estimating", color: "text-emerald-300" },
  decision: { prefix: "★", tone: "Choosing",   color: "text-sky-300" },
};

type LogEntry = {
  id: number;
  kind: LogKind;
  text: string;
};

export function GeneratingScreen() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [typed, setTyped] = useState<Record<number, string>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const scriptIdxRef = useRef(0);
  const tailIdxRef = useRef(0);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedMotionRef.current =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    function pushNext() {
      if (cancelledRef.current) return;
      const idx = scriptIdxRef.current;
      let next: ScriptEntry;
      if (idx < SCRIPT.length) {
        next = SCRIPT[idx];
      } else {
        const tailIdx = tailIdxRef.current;
        next = {
          kind: "thinking",
          text: TAIL_TEXTS[tailIdx % TAIL_TEXTS.length],
          durationMs: 2200,
        };
        tailIdxRef.current = tailIdx + 1;
      }
      scriptIdxRef.current += 1;
      const id = idRef.current++;
      setEntries((prev) => [...prev.slice(-8), { id, kind: next.kind, text: next.text }]);
      streamTimerRef.current = setTimeout(pushNext, next.durationMs);
    }
    streamTimerRef.current = setTimeout(pushNext, 300);
    return () => {
      cancelledRef.current = true;
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;
    const last = entries[entries.length - 1];
    const target = last.text;
    if (reducedMotionRef.current) {
      setTyped((prev) => (prev[last.id] === target ? prev : { ...prev, [last.id]: target }));
      return;
    }
    const current = typed[last.id] ?? "";
    if (current.length >= target.length) return;
    const speed = 18 + Math.random() * 15;
    typeTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setTyped((prev) => ({
        ...prev,
        [last.id]: target.slice(0, (prev[last.id]?.length ?? 0) + 1),
      }));
    }, speed);
    return () => {
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
    };
  }, [entries, typed]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries, typed]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-6">
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

        <div
          ref={containerRef}
          aria-live="polite"
          aria-label="AI architect reasoning progress"
          className="mt-6 max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/70 p-4 font-mono text-sm leading-relaxed"
        >
          {entries.map((entry) => {
            const style = KIND_STYLES[entry.kind];
            const text = typed[entry.id] ?? "";
            const isLast = entry === entries[entries.length - 1];
            const typing = isLast && text.length < entry.text.length;
            return (
              <div key={entry.id} className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-[10px] uppercase tracking-widest text-slate-500">
                  {style.tone}
                </span>
                <span aria-hidden className="select-none text-slate-600">
                  {style.prefix}
                </span>
                <span className={cx("whitespace-pre-wrap", style.color)}>
                  {text}
                  {typing && (
                    <span
                      aria-hidden
                      className="ml-0.5 inline-block h-3.5 w-1.5 -mb-0.5 animate-pulse bg-sky-400 align-middle"
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
