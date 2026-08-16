"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const variants = {
    primary: "bg-indigo-500 hover:bg-indigo-400 text-white disabled:bg-indigo-500/40",
    secondary: "bg-white/10 hover:bg-white/15 text-white border border-white/10",
    ghost: "hover:bg-white/10 text-white/80",
    danger: "bg-red-500/90 hover:bg-red-500 text-white",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        variants[variant],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/[0.03] p-5", className)}>
      {children}
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  gray: "bg-white/10 text-white/70",
  green: "bg-emerald-500/15 text-emerald-300",
  red: "bg-red-500/15 text-red-300",
  blue: "bg-sky-500/15 text-sky-300",
  yellow: "bg-amber-500/15 text-amber-300",
  purple: "bg-violet-500/15 text-violet-300",
};

export function Badge({
  color = "gray",
  children,
}: {
  color?: keyof typeof BADGE_COLORS;
  children: ReactNode;
}) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", BADGE_COLORS[color])}>
      {children}
    </span>
  );
}

/** Map a domain status string to a badge colour. */
export function statusColor(status: string): keyof typeof BADGE_COLORS {
  switch (status) {
    case "accepted":
    case "completed":
    case "ready":
      return "green";
    case "rejected":
    case "failed":
      return "red";
    case "processing":
    case "rendering":
    case "queued":
      return "blue";
    case "reedit":
    case "uploaded":
      return "yellow";
    case "exported":
      return "purple";
    default:
      return "gray";
  }
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-indigo-500 transition-all"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/10", className)} />;
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
      <p className="text-white/80">{title}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-white/40">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
      <p className="text-red-300">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
