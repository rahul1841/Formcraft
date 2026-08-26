import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AnswerValue, FieldSnapshot, FormField, Submission } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* --------------------------------- colours -------------------------------- */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  const int = Number.parseInt(h || "000000", 16);
  if (!Number.isFinite(int)) return { r: 0, g: 0, b: 0 };
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Relative luminance, used to pick readable text on a coloured surface. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function readableTextOn(hex: string): string {
  return luminance(hex) > 0.55 ? "#0f172a" : "#ffffff";
}

export function mix(hex: string, withHex: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  const r = Math.round(a.r + (b.r - a.r) * amount);
  const g = Math.round(a.g + (b.g - a.g) * amount);
  const bl = Math.round(a.b + (b.b - a.b) * amount);
  return `#${[r, g, bl].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/* ---------------------------------- dates --------------------------------- */

export function formatDate(value: string | Date, withTime = true): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function relativeTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (Number.isNaN(mins)) return "—";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d, false);
}

export function dateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

/* --------------------------------- answers -------------------------------- */

/** Render any answer value as readable text (tables, CSV, analytics). */
export function answerToText(value: AnswerValue, field?: FormField): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((v) => labelForValue(v, field))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  return labelForValue(value, field);
}

function labelForValue(value: string, field?: FormField): string {
  if (!field?.options?.length) return value;
  return field.options.find((o) => o.value === value)?.label ?? value;
}

/**
 * Flattens a submission's answers into one searchable string.
 * MongoDB cannot regex-match inside a Mixed sub-document, so this is denormalised
 * onto the submission at write time and indexed.
 */
export function buildSearchText(
  fields: FormField[],
  data: Record<string, AnswerValue>,
): string {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const parts: string[] = [];
  for (const [id, value] of Object.entries(data)) {
    const text = answerToText(value, byId.get(id));
    if (text) parts.push(text);
  }
  return parts.join(" \u2022 ").slice(0, 20000);
}

/* ----------------------------------- csv ---------------------------------- */

export function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Guard against spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

/**
 * Turn submissions into a CSV using the form's current fields as columns,
 * falling back to each submission's own snapshot for fields since deleted.
 */
export function submissionsToCsv(
  fields: FormField[],
  submissions: Submission[],
): string {
  const columns: FieldSnapshot[] = fields
    .filter((f) => f.type !== "heading" && f.type !== "paragraph" && f.type !== "divider")
    .map((f) => ({ id: f.id, label: f.label || f.type, type: f.type }));

  const known = new Set(columns.map((c) => c.id));
  for (const sub of submissions) {
    for (const snap of sub.fieldSnapshot ?? []) {
      if (!known.has(snap.id)) {
        known.add(snap.id);
        columns.push({ ...snap, label: `${snap.label || snap.id} (removed)` });
      }
    }
  }

  const byId = new Map(fields.map((f) => [f.id, f]));
  const header = ["Response ID", "Submitted at", ...columns.map((c) => c.label)];
  const rows = submissions.map((s) => [
    s.id,
    formatDate(s.submittedAt),
    ...columns.map((c) => answerToText(s.data?.[c.id] ?? null, byId.get(c.id))),
  ]);

  return buildCsv([header, ...rows]);
}

/* ---------------------------------- misc ---------------------------------- */

export function pluralize(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
