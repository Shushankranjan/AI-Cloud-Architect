"use client";

import { useState } from "react";
import type {
  ArchitectureOption,
  ChatMessage,
  ExportFormat,
  GenerateResponse,
  ProposedChange,
  SelectResponse,
} from "@/lib/types";
import { PARADIGM_LABELS } from "@/lib/format";
import { AnalysisTabs } from "./AnalysisTabs";
import { ChatPanel } from "./ChatPanel";
import { MermaidDiagram } from "./MermaidDiagram";
import { Badge, Button, Card, SectionTitle } from "./ui";

export function WorkspaceScreen({
  generated,
  selected,
  option,
  chatMessages,
  proposedChanges,
  chatBusy,
  exporting,
  onChat,
  onExport,
  onRefine,
  onStartOver,
}: {
  generated: GenerateResponse;
  selected: SelectResponse;
  option: ArchitectureOption;
  chatMessages: ChatMessage[];
  proposedChanges: ProposedChange[];
  chatBusy: boolean;
  exporting: boolean;
  onChat: (message: string) => void;
  onExport: (format: ExportFormat) => void;
  onRefine: () => void;
  onStartOver: () => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-100">{option.name}</h2>
            <Badge tone="sky">{PARADIGM_LABELS[option.paradigm]}</Badge>
            <Badge tone="slate">v{generated.version}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{option.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onRefine}>
            Modify requirements
          </Button>
          <div className="relative">
            <Button
              variant="primary"
              onClick={() => setExportOpen((v) => !v)}
              disabled={exporting}
            >
              {exporting ? "Exporting…" : "Finalize & export"}
            </Button>
            {exportOpen && (
              <div className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                {(
                  [
                    ["markdown", "Markdown report (.md)"],
                    ["mermaid", "Mermaid diagram (.mmd)"],
                    ["json", "Architecture spec (.json)"],
                  ] as [ExportFormat, string][]
                ).map(([format, label]) => (
                  <button
                    key={format}
                    onClick={() => {
                      setExportOpen(false);
                      onExport(format);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={onStartOver}>
            Start over
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="p-5">
            <SectionTitle>Architecture diagram</SectionTitle>
            <div className="mt-1 text-sm font-medium text-slate-300">
              {selected.diagram.title}
            </div>
            <div className="mermaid-container mt-4 overflow-x-auto rounded-lg bg-slate-100 p-4">
              <MermaidDiagram chart={selected.diagram.mermaid_source} />
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
                View Mermaid source
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
                {selected.diagram.mermaid_source}
              </pre>
            </details>
          </Card>

          <AnalysisTabs analysis={selected.analysis} />

          <Card className="p-5">
            <SectionTitle>Services in this architecture</SectionTitle>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {option.services.map((svc) => (
                <div
                  key={svc.name}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5"
                >
                  <div className="text-sm font-medium text-slate-200">{svc.name}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{svc.role}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="min-h-[480px] xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <ChatPanel
            messages={chatMessages}
            proposedChanges={proposedChanges}
            busy={chatBusy}
            onSend={onChat}
          />
        </div>
      </div>
    </div>
  );
}
