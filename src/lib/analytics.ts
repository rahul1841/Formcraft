import { isAnswerable } from "@/lib/constants";
import { answerToText, dateKey } from "@/lib/utils";
import { isEmptyAnswer } from "@/lib/validation";
import type {
  FieldAnalytics,
  Form,
  FormAnalytics,
  OptionCount,
  Submission,
} from "@/lib/types";

const NUMERIC_TYPES = new Set(["number", "rating", "range"]);
const CHOICE_TYPES = new Set(["select", "radio", "multiselect", "checkboxGroup"]);
const TEXT_TYPES = new Set(["text", "textarea", "email", "phone", "url"]);

function median(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Build the last `days` days of submission counts, including empty days. */
function buildTimeline(submissions: Submission[], days = 30) {
  const counts = new Map<string, number>();
  for (const sub of submissions) {
    const key = dateKey(sub.submittedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const timeline: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    timeline.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return timeline;
}

/**
 * Turns raw submissions into the numbers the analytics dashboard shows.
 * Pure: the API route and any server component can call it with the same input.
 */
export function computeAnalytics(
  form: Form,
  submissions: Submission[],
): FormAnalytics {
  const total = submissions.length;
  const timeline = buildTimeline(submissions);

  // Read the headline counts straight off the timeline so the stat tiles can
  // never disagree with the chart sitting underneath them.
  const responsesToday = timeline[timeline.length - 1]?.count ?? 0;
  const responsesThisWeek = timeline
    .slice(-7)
    .reduce((sum, day) => sum + day.count, 0);

  const durations = submissions
    .map((s) => s.meta?.durationMs)
    .filter((d): d is number => typeof d === "number" && d > 0 && d < 6 * 60 * 60 * 1000);
  const averageCompletionSeconds = durations.length
    ? round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000, 1)
    : null;

  const answerableFields = form.fields.filter((f) => isAnswerable(f.type));

  const completionRate = (() => {
    if (!total || !answerableFields.length) return 0;
    const ratios = submissions.map((sub) => {
      const filled = answerableFields.filter(
        (f) => !isEmptyAnswer(sub.data?.[f.id]),
      ).length;
      return filled / answerableFields.length;
    });
    return round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100, 1);
  })();

  const fields: FieldAnalytics[] = answerableFields.map((field) => {
    const values = submissions.map((s) => s.data?.[field.id] ?? null);
    const answered = values.filter((v) => !isEmptyAnswer(v)).length;

    const base: FieldAnalytics = {
      fieldId: field.id,
      label: field.label || field.type,
      type: field.type,
      answered,
      skipped: total - answered,
    };

    if (CHOICE_TYPES.has(field.type)) {
      const counts = new Map<string, number>();
      for (const value of values) {
        if (isEmptyAnswer(value)) continue;
        const list = Array.isArray(value) ? value : [String(value)];
        for (const item of list) {
          counts.set(String(item), (counts.get(String(item)) ?? 0) + 1);
        }
      }
      const options: OptionCount[] = (field.options ?? []).map((option) => ({
        label: option.label || option.value,
        value: option.value,
        count: counts.get(option.value) ?? 0,
        percentage: answered ? round(((counts.get(option.value) ?? 0) / answered) * 100, 1) : 0,
      }));
      // Values recorded before an option was renamed / removed.
      for (const [value, count] of counts) {
        if (!options.some((o) => o.value === value)) {
          options.push({
            label: value,
            value,
            count,
            percentage: answered ? round((count / answered) * 100, 1) : 0,
          });
        }
      }
      base.options = options.sort((a, b) => b.count - a.count);
    } else if (field.type === "checkbox") {
      const yes = values.filter((v) => v === true).length;
      base.options = [
        {
          label: "Checked",
          value: "true",
          count: yes,
          percentage: total ? round((yes / total) * 100, 1) : 0,
        },
        {
          label: "Not checked",
          value: "false",
          count: total - yes,
          percentage: total ? round(((total - yes) / total) * 100, 1) : 0,
        },
      ];
    } else if (NUMERIC_TYPES.has(field.type)) {
      // `null` for a skipped answer would become 0 through Number(), which would
      // drag the average down and add a phantom bucket to the distribution.
      const numbers = values
        .filter((v) => !isEmptyAnswer(v))
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((n) => Number.isFinite(n));
      if (numbers.length) {
        const sorted = [...numbers].sort((a, b) => a - b);
        base.stats = {
          average: round(numbers.reduce((a, b) => a + b, 0) / numbers.length),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          median: round(median(sorted)),
        };
        // A distribution is useful for ratings and small integer ranges.
        if (field.type === "rating" || field.type === "range") {
          const counts = new Map<number, number>();
          for (const n of numbers) counts.set(n, (counts.get(n) ?? 0) + 1);
          base.options = [...counts.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([value, count]) => ({
              label: String(value),
              value: String(value),
              count,
              percentage: numbers.length ? round((count / numbers.length) * 100, 1) : 0,
            }));
        }
      }
    } else if (TEXT_TYPES.has(field.type) || field.type === "date" || field.type === "time") {
      base.samples = submissions
        .slice(0, 200)
        .map((s) => answerToText(s.data?.[field.id] ?? null, field))
        .filter((t) => t.trim() !== "")
        .slice(0, 8);
    }

    return base;
  });

  return {
    formId: form.id,
    title: form.title,
    totalResponses: total,
    responsesToday,
    responsesThisWeek,
    averageCompletionSeconds,
    completionRate,
    timeline,
    fields,
  };
}
