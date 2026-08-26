"use client";

import { useState } from "react";
import { Check, Copy, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { isAnswerable } from "@/lib/constants";
import { formatDate, relativeTime } from "@/lib/utils";
import type {
  AnswerValue,
  FieldType,
  Form,
  FormField,
  Submission,
} from "@/lib/types";

interface Row {
  id: string;
  label: string;
  type: FieldType;
  field?: FormField;
  removed: boolean;
}

function optionLabel(value: string, field?: FormField): string {
  return field?.options?.find((o) => o.value === value)?.label ?? value;
}

function formatDateAnswer(value: string): string {
  // A bare "YYYY-MM-DD" parses as UTC midnight and would render as the previous
  // day west of UTC, so pin date-only answers to local midnight.
  const d = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
  );
  return Number.isNaN(d.getTime()) ? value : formatDate(d, false);
}

// The url validator makes the scheme optional, so a bare "acme.co.uk" answer
// would resolve as a relative link. Normalise it, and only hand back an href for
// http(s) so a respondent-supplied javascript:/data: value can never be clicked.
function linkableUrl(value: string): string | null {
  try {
    const url = new URL(/^[a-zA-Z][\w+.-]*:/.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function StarScale({ value, max }: { value: number; max: number }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`${value} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={
            i < value
              ? "size-4 fill-amber-400 text-amber-400"
              : "size-4 text-slate-300"
          }
          aria-hidden
        />
      ))}
      <span className="ml-1 text-[13px] font-medium text-slate-600 tabular-nums">
        {value}/{max}
      </span>
    </span>
  );
}

function NotAnswered() {
  return <span className="text-[13px] text-slate-400 italic">Not answered</span>;
}

function AnswerValueView({ row, value }: { row: Row; value: AnswerValue }) {
  if (value === null || value === undefined) return <NotAnswered />;

  if (Array.isArray(value)) {
    if (value.length === 0) return <NotAnswered />;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex max-w-full items-center rounded-md bg-brand-50 px-2 py-0.5 text-[13px] font-medium break-words text-brand-700 ring-1 ring-brand-100 ring-inset"
          >
            {optionLabel(String(item), row.field)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <Badge tone={value ? "success" : "neutral"}>{value ? "Yes" : "No"}</Badge>
    );
  }

  if (typeof value === "string" && value.trim() === "") return <NotAnswered />;

  if (row.type === "rating") {
    return <StarScale value={Number(value)} max={row.field?.maxRating ?? 5} />;
  }

  if (typeof value === "number") {
    return <span className="text-sm text-slate-800 tabular-nums">{value}</span>;
  }

  if (row.type === "date") {
    return <span className="text-sm text-slate-800">{formatDateAnswer(value)}</span>;
  }

  if (row.type === "textarea") {
    return (
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-800">
        {value}
      </p>
    );
  }

  if (row.type === "url" || row.type === "email") {
    const href = row.type === "email" ? `mailto:${value}` : linkableUrl(value);
    if (href === null) {
      return <span className="text-sm break-all text-slate-800">{value}</span>;
    }
    return (
      <a
        href={href}
        target={row.type === "url" ? "_blank" : undefined}
        rel="noreferrer"
        className="text-sm break-all text-brand-700 underline underline-offset-2 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        {value}
      </a>
    );
  }

  return (
    <span className="text-sm break-words text-slate-800">
      {optionLabel(value, row.field)}
    </span>
  );
}

export function ResponseDetailModal({
  form,
  submission,
  onClose,
}: {
  form: Form;
  submission: Submission | null;
  onClose: () => void;
}) {
  // Tracking the copied id (rather than a boolean) resets the tick automatically
  // when a different response is opened.
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copied = submission !== null && copiedId === submission.id;

  const copyId = async () => {
    if (!submission) return;
    try {
      await navigator.clipboard.writeText(submission.id);
      setCopiedId(submission.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      /* clipboard unavailable — the id stays visible for manual copying */
    }
  };

  const rows: Row[] = form.fields
    .filter((f) => isAnswerable(f.type))
    .map((f) => ({
      id: f.id,
      label: f.label || f.type,
      type: f.type,
      field: f,
      removed: false,
    }));

  // Questions deleted since this response arrived still deserve to be shown.
  const known = new Set(rows.map((r) => r.id));
  for (const snap of submission?.fieldSnapshot ?? []) {
    if (known.has(snap.id) || !isAnswerable(snap.type)) continue;
    known.add(snap.id);
    rows.push({
      id: snap.id,
      label: snap.label || snap.id,
      type: snap.type,
      removed: true,
    });
  }

  const durationSeconds =
    submission?.meta?.durationMs && submission.meta.durationMs > 0
      ? Math.round(submission.meta.durationMs / 1000)
      : null;

  return (
    <Modal
      open={Boolean(submission)}
      onClose={onClose}
      size="lg"
      title="Response details"
      description={
        submission
          ? `Submitted ${relativeTime(submission.submittedAt)}`
          : undefined
      }
      footer={
        submission ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <dl className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <div className="flex min-w-0 items-center gap-1.5">
                <dt className="sr-only">Response ID</dt>
                <dd className="truncate font-mono text-[11.5px]">{submission.id}</dd>
                <button
                  type="button"
                  onClick={copyId}
                  aria-label="Copy response ID"
                  title="Copy response ID"
                  className="flex-none cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Submitted at</dt>
                <dd>{formatDate(submission.submittedAt)}</dd>
              </div>
              {durationSeconds !== null ? (
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Completion time</dt>
                  <dd>Completed in {durationSeconds}s</dd>
                </div>
              ) : null}
            </dl>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : null
      }
    >
      {submission ? (
        rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            This form has no questions, so there is nothing to show.
          </p>
        ) : (
          <dl className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.id} className="grid gap-1.5 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-600 sm:col-span-1">
                  <span className="break-words">{row.label}</span>
                  {row.removed ? (
                    <Badge tone="warning" className="text-[10.5px]">
                      removed field
                    </Badge>
                  ) : null}
                </dt>
                <dd className="min-w-0 sm:col-span-2">
                  <AnswerValueView row={row} value={submission.data?.[row.id] ?? null} />
                </dd>
              </div>
            ))}
          </dl>
        )
      ) : null}
    </Modal>
  );
}
