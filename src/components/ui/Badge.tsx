import { cn } from "@/lib/utils";
import type { FormStatus } from "@/lib/types";

const TONES = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<FormStatus, BadgeTone> = {
  draft: "neutral",
  published: "success",
  closed: "warning",
};

const STATUS_LABEL: Record<FormStatus, string> = {
  draft: "Draft",
  published: "Live",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: FormStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "published"
            ? "bg-emerald-500"
            : status === "closed"
              ? "bg-amber-500"
              : "bg-slate-400",
        )}
      />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
