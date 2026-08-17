"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ProposedChange } from "@/lib/types";
import { titleCase } from "@/lib/format";
import { Badge, Spinner, cx } from "./ui";

const actionTone: Record<string, "emerald" | "rose" | "amber" | "sky"> = {
  add_service: "emerald",
  remove_service: "rose",
  replace_service: "amber",
  modify_config: "sky",
};

const SUGGESTIONS = [
  "What breaks at 10x traffic?",
  "How do I cut costs by 30%?",
  "Make this HIPAA compliant",
];

export function ChatPanel({
  messages,
  proposedChanges,
  busy,
  onSend,
}: {
  messages: ChatMessage[];
  proposedChanges: ProposedChange[];
  busy: boolean;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, proposedChanges, busy]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setDraft("");
    onSend(trimmed);
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">AI Architect Chat</h3>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Ask about trade-offs, changes, or “what-if” scenarios
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-sky-500/50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={`${msg.timestamp}-${i}`}
              className={cx("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cx(
                  "max-w-[90%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-sky-500 text-slate-950"
                    : "border border-slate-800 bg-slate-950/70 text-slate-200",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Spinner className="text-sky-400" />
              Architect is thinking…
            </div>
          )}

          {proposedChanges.length > 0 && !busy && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="text-xs font-semibold text-slate-300">
                Proposed architecture changes
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {proposedChanges.map((change) => (
                  <div key={change.id} className="rounded-lg bg-slate-900 p-2.5">
                    <div className="flex items-center gap-2">
                      <Badge tone={actionTone[change.action] ?? "slate"}>
                        {titleCase(change.action)}
                      </Badge>
                      <span className="text-xs font-medium text-slate-200">
                        {change.description}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {change.detail}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-600">
                Phase 2: accept/reject applies changes to the architecture.
              </p>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="border-t border-slate-800 p-3"
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the architect…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
