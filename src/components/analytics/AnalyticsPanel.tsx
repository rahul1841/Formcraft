"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChartColumnBig,
  ChartPie,
  Gauge,
  Inbox,
  Quote,
  Star,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  OptionBarChart,
  OptionPieChart,
  TimelineChart,
  chartColor,
} from "@/components/analytics/Charts";
import { FIELD_META } from "@/lib/constants";
import { FIELD_ICONS } from "@/lib/field-icons";
import { cn } from "@/lib/utils";
import type { FieldAnalytics, Form, FormAnalytics, OptionCount } from "@/lib/types";

/** 84 -> "1m 24s", 42 -> "42s". */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

/* -------------------------------------------------------------------------- */
/*                                 Stat tiles                                  */
/* -------------------------------------------------------------------------- */

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="grid size-7 flex-none place-items-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
        <span className="truncate text-[13px] font-medium">{label}</span>
      </div>
      <p className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Option legend / table                            */
/* -------------------------------------------------------------------------- */

function OptionLegend({ options }: { options: OptionCount[] }) {
  return (
    <ul className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
      {options.map((option, i) => (
        <li key={`${option.value}-${i}`}>
          <div className="flex items-baseline gap-2.5">
            <span
              className="mt-1.5 size-2.5 flex-none rounded-full"
              style={{ backgroundColor: chartColor(i) }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700" title={option.label}>
              {option.label}
            </span>
            <span className="flex-none text-[13px] font-medium text-slate-900 tabular-nums">
              {option.count}
            </span>
            <span className="w-12 flex-none text-right text-xs text-slate-400 tabular-nums">
              {option.percentage}%
            </span>
          </div>
          <div className="mt-1.5 ml-5 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, Math.max(option.count > 0 ? 2 : 0, option.percentage))}%`,
                backgroundColor: chartColor(i),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Field card                                  */
/* -------------------------------------------------------------------------- */

function NumberTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-center">
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

function ChartToggle({
  value,
  onChange,
}: {
  value: "bar" | "donut";
  onChange: (v: "bar" | "donut") => void;
}) {
  return (
    <SegmentedControl<"bar" | "donut">
      value={value}
      onChange={onChange}
      size="sm"
      fullWidth={false}
      className="flex-none"
      options={[
        {
          value: "bar",
          icon: <ChartColumnBig className="size-3.5" />,
          label: "Bar",
          title: "Show as bar chart",
        },
        {
          value: "donut",
          icon: <ChartPie className="size-3.5" />,
          label: "Donut",
          title: "Show as donut chart",
        },
      ]}
    />
  );
}

function FieldCard({ field }: { field: FieldAnalytics }) {
  const options = field.options ?? [];
  const hasChart = options.some((o) => o.count > 0);
  const [chart, setChart] = useState<"bar" | "donut">(
    options.length > 0 && options.length <= 6 ? "donut" : "bar",
  );

  const Icon = FIELD_ICONS[field.type] ?? Quote;
  const meta = FIELD_META[field.type];
  const chartData = options.map((o) => ({ label: o.label, count: o.count }));
  const showToggle = Boolean(field.options && hasChart && !field.stats);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold break-words text-slate-900">{field.label}</h3>
          <p className="mt-1 text-[13px] text-slate-500 tabular-nums">
            {field.answered} answered · {field.skipped} skipped
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Badge tone="neutral">
            <Icon className="size-3" aria-hidden />
            {meta?.name ?? field.type}
          </Badge>
          {showToggle ? <ChartToggle value={chart} onChange={setChart} /> : null}
        </div>
      </div>

      <div className="px-5 py-4">
        {field.answered === 0 && !hasChart ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-[13px] text-slate-500">
            Nobody has answered this question yet.
          </p>
        ) : field.stats ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  Average
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                  {field.stats.average}
                  {field.type === "rating" ? (
                    <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden />
                  ) : null}
                </p>
              </div>
              <div className="grid flex-1 grid-cols-3 gap-2 sm:max-w-sm">
                <NumberTile label="Min" value={String(field.stats.min)} />
                <NumberTile label="Median" value={String(field.stats.median)} />
                <NumberTile label="Max" value={String(field.stats.max)} />
              </div>
            </div>
            {hasChart ? (
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-[13px] font-medium text-slate-600">Distribution</p>
                <OptionBarChart data={chartData} />
                <OptionLegend options={options} />
              </div>
            ) : null}
          </div>
        ) : field.options ? (
          <div>
            {chart === "donut" ? (
              <OptionPieChart data={chartData} />
            ) : (
              <OptionBarChart data={chartData} />
            )}
            <OptionLegend options={options} />
          </div>
        ) : field.samples && field.samples.length > 0 ? (
          <div>
            <ul className="space-y-2">
              {field.samples.map((sample, i) => (
                <li
                  key={`${i}-${sample.slice(0, 12)}`}
                  className="flex gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5"
                >
                  <Quote className="mt-0.5 size-3.5 flex-none text-slate-300" aria-hidden />
                  <p className="min-w-0 text-[13px] leading-relaxed break-words whitespace-pre-wrap text-slate-700">
                    {sample}
                  </p>
                </li>
              ))}
            </ul>
            {field.answered > field.samples.length ? (
              <p className="mt-3 text-xs text-slate-400">
                Showing the {field.samples.length} most recent of {field.answered} answers — export
                the responses for the full list.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-[13px] text-slate-500">
            Nobody has answered this question yet.
          </p>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Panel                                    */
/* -------------------------------------------------------------------------- */

export function AnalyticsPanel({
  analytics,
  form,
}: {
  analytics: FormAnalytics;
  form: Form;
}) {
  if (analytics.totalResponses === 0) {
    return (
      <EmptyState
        icon={<ChartColumnBig className="size-5" />}
        title="No data yet"
        description={
          <>
            Charts, averages and per-question breakdowns appear here as soon as the first response
            arrives. Share{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-700">
              /f/{form.slug}
            </code>{" "}
            to start collecting.
          </>
        }
      />
    );
  }

  const tiles = [
    {
      icon: <Inbox className="size-4" />,
      label: "Total responses",
      value: String(analytics.totalResponses),
    },
    {
      icon: <TrendingUp className="size-4" />,
      label: "Last 7 days",
      value: String(analytics.responsesThisWeek),
    },
    {
      icon: <CalendarDays className="size-4" />,
      label: "Today",
      value: String(analytics.responsesToday),
    },
    {
      icon: <Gauge className="size-4" />,
      label: "Completion rate",
      value: `${analytics.completionRate}%`,
      hint: "Average share of questions answered",
    },
  ];

  if (analytics.averageCompletionSeconds !== null) {
    tiles.push({
      icon: <Timer className="size-4" />,
      label: "Avg. time to complete",
      value: formatDuration(analytics.averageCompletionSeconds),
    });
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "grid grid-cols-2 gap-3",
          tiles.length === 5 ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4",
        )}
      >
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>

      <Card>
        <CardHeader
          title="Responses over time"
          description="Daily submissions across the last 30 days"
        />
        <div className="px-3 py-4 sm:px-5">
          <TimelineChart data={analytics.timeline} />
        </div>
      </Card>

      {analytics.fields.length === 0 ? (
        <EmptyState
          title="No questions to summarise"
          description="This form has no answerable fields yet. Add a question in the builder to see a per-question breakdown here."
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Question breakdown</h2>
          {analytics.fields.map((field) => (
            <FieldCard key={field.fieldId} field={field} />
          ))}
        </div>
      )}
    </div>
  );
}
