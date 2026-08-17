"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  ChatMessage,
  ExamplePrompt,
  ExportFormat,
  GenerateResponse,
  ProposedChange,
  RequirementsInput,
  SelectResponse,
} from "@/lib/types";
import { GeneratingScreen } from "./GeneratingScreen";
import { OptionsScreen } from "./OptionsScreen";
import { RequirementsForm } from "./RequirementsForm";
import { WorkspaceScreen } from "./WorkspaceScreen";
import { cx } from "./ui";

type Stage = "input" | "generating" | "options" | "workspace";

const FLOW_STEPS: { key: Stage[]; label: string }[] = [
  { key: ["input", "generating"], label: "Requirements" },
  { key: ["options"], label: "Compare options" },
  { key: ["workspace"], label: "Architecture" },
];

function download(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ArchitectFlow() {
  const [stage, setStage] = useState<Stage>("input");
  const [examples, setExamples] = useState<ExamplePrompt[]>([]);
  const [requirements, setRequirements] = useState<RequirementsInput | null>(null);
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);
  const [selected, setSelected] = useState<SelectResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([]);
  const [refining, setRefining] = useState(false);
  const [selectBusy, setSelectBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .examples()
      .then(setExamples)
      .catch(() => setExamples([]));
  }, []);

  async function handleGenerate(req: RequirementsInput) {
    setError(null);
    setRequirements(req);
    setStage("generating");
    const minDelay = new Promise((resolve) => setTimeout(resolve, 3200));
    try {
      const [res] = await Promise.all([api.generate(req), minDelay]);
      setGenerated(res);
      setSelected(null);
      setChatMessages([]);
      setProposedChanges([]);
      setStage("options");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("input");
    }
  }

  async function handleRefineSubmit(req: RequirementsInput) {
    if (!generated) return handleGenerate(req);
    setError(null);
    setRequirements(req);
    setStage("generating");
    const minDelay = new Promise((resolve) => setTimeout(resolve, 3200));
    try {
      const [res] = await Promise.all([
        api.refine({ session_id: generated.session_id, requirements: req }),
        minDelay,
      ]);
      setGenerated(res);
      setSelected(null);
      setChatMessages([]);
      setProposedChanges([]);
      setRefining(false);
      setStage("options");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("input");
    }
  }

  async function handleSelect(optionId: string) {
    if (!generated) return;
    setError(null);
    setSelectBusy(true);
    try {
      const res = await api.select(generated.session_id, optionId);
      setSelected(res);
      setChatMessages([]);
      setProposedChanges([]);
      setStage("workspace");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSelectBusy(false);
    }
  }

  async function handleChat(message: string) {
    if (!generated) return;
    setError(null);
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatBusy(true);
    try {
      const res = await api.chat(generated.session_id, message);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setProposedChanges(res.proposed_changes);
      if (res.updated_diagram) {
        setSelected((prev) =>
          prev ? { ...prev, diagram: res.updated_diagram ?? prev.diagram } : prev,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChatBusy(false);
    }
  }

  async function handleExport(format: ExportFormat) {
    if (!generated) return;
    setError(null);
    setExporting(true);
    try {
      const res = await api.export(generated.session_id, format);
      download(res.filename, res.content, res.content_type);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  function handleStartOver() {
    setStage("input");
    setRequirements(null);
    setGenerated(null);
    setSelected(null);
    setChatMessages([]);
    setProposedChanges([]);
    setRefining(false);
    setError(null);
  }

  const activeStepIndex = FLOW_STEPS.findIndex((s) => s.key.includes(stage));
  const selectedOption =
    generated && selected
      ? generated.options.find((o) => o.id === selected.selected_option_id)
      : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <button onClick={handleStartOver} className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-lg">
            ☁
          </div>
          <div>
            <div className="font-semibold tracking-tight text-slate-100">
              AI Cloud Architect
            </div>
            <div className="text-xs text-slate-500">
              Describe your app. Get a production-ready architecture.
            </div>
          </div>
        </button>

        <nav className="flex items-center gap-1">
          {FLOW_STEPS.map((step, i) => {
            const active = i === activeStepIndex;
            const done = i < activeStepIndex;
            return (
              <div key={step.label} className="flex items-center gap-1">
                {i > 0 && <div className="h-px w-6 bg-slate-800" />}
                <div
                  className={cx(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                    active && "border-sky-500/50 bg-sky-500/10 text-sky-300",
                    done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                    !active && !done && "border-slate-800 text-slate-600",
                  )}
                >
                  <span>{done ? "✓" : i + 1}</span>
                  {step.label}
                </div>
              </div>
            );
          })}
        </nav>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            ✕
          </button>
        </div>
      )}

      {stage === "input" && (
        <RequirementsForm
          examples={examples}
          initial={refining ? requirements : null}
          busy={false}
          error={null}
          submitLabel={refining ? "Regenerate architectures" : "Generate architectures"}
          onSubmit={refining ? handleRefineSubmit : handleGenerate}
        />
      )}

      {stage === "generating" && <GeneratingScreen />}

      {stage === "options" && generated && (
        <OptionsScreen
          generated={generated}
          busy={selectBusy}
          onSelect={handleSelect}
          onRefine={() => {
            setRefining(true);
            setStage("input");
          }}
        />
      )}

      {stage === "workspace" && generated && selected && selectedOption && (
        <WorkspaceScreen
          generated={generated}
          selected={selected}
          option={selectedOption}
          chatMessages={chatMessages}
          proposedChanges={proposedChanges}
          chatBusy={chatBusy}
          exporting={exporting}
          onChat={handleChat}
          onExport={handleExport}
          onRefine={() => {
            setRefining(true);
            setStage("input");
          }}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
