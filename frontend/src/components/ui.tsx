import type { ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Columns2,
  Download,
  PencilLine,
  RotateCcw,
  Send,
  Sparkles,
  type IconNode,
} from "lucide";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const ICONS = {
  Sparkles,
  Columns2,
  PencilLine,
  Download,
  RotateCcw,
  Check,
  ChevronDown,
  Send,
} as const satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const nodes = ICONS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cx("h-4 w-4 shrink-0", className)}
    >
      {nodes.map(([tag, attrs], i) => {
        const Tag = tag as keyof React.JSX.IntrinsicElements;
        return <Tag key={i} {...attrs} />;
      })}
    </svg>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "sky" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    sky: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 font-semibold",
    secondary:
      "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 disabled:opacity-50",
    ghost: "text-slate-300 hover:bg-slate-800 disabled:opacity-50",
    danger: "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cx(
        "text-xs font-semibold uppercase tracking-widest text-slate-400",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cx("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
