"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pluralize, truncate } from "@/lib/utils";

/** Shared categorical palette — readable on white, distinguishable side by side. */
export const CHART_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0d9488",
  "#ec4899",
];

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

const AXIS_TICK = { fontSize: 12, fill: "#64748b" } as const;
const GRID_STROKE = "#e2e8f0";
const TIMELINE_GRADIENT_ID = "ncf-timeline-gradient";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDay(value: string | number | undefined): Date | null {
  if (value === undefined) return null;
  const d = new Date(`${String(value)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Mar" — compact axis label. */
function shortDate(value: string | number | undefined): string {
  const d = parseDay(value);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : String(value ?? "");
}

/** "12 Mar 2026" — tooltip heading. */
function longDate(value: string | number | undefined): string {
  const d = parseDay(value);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : String(value ?? "");
}

/* -------------------------------------------------------------------------- */
/*                              Shared internals                               */
/* -------------------------------------------------------------------------- */

export interface CountDatum {
  label: string;
  count: number;
}

type TooltipEntry = {
  name?: string | number;
  value?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
};

interface TooltipRenderProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: string | number;
}

const TOOLTIP_SHELL =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] shadow-lg shadow-slate-900/10";

function ChartEmpty({ message, height }: { message: string; height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-[13px] text-slate-500"
      style={{ height }}
    >
      {message}
    </div>
  );
}

function isBlank(data: { count: number }[]): boolean {
  return data.length === 0 || data.every((d) => !d.count);
}

/* -------------------------------------------------------------------------- */
/*                                  Timeline                                   */
/* -------------------------------------------------------------------------- */

function TimelineTooltip({ active, payload, label }: TooltipRenderProps) {
  if (!active || !payload?.length) return null;
  const count = Number(payload[0]?.value ?? 0);
  return (
    <div className={TOOLTIP_SHELL}>
      <p className="font-medium text-slate-900">{longDate(label)}</p>
      <p className="mt-0.5 text-slate-500">{pluralize(count, "response")}</p>
    </div>
  );
}

export function TimelineChart({ data }: { data: { date: string; count: number }[] }) {
  const height = 260;
  if (isBlank(data)) {
    return (
      <ChartEmpty
        height={height}
        message="No responses in this period yet — the trend line appears as soon as they arrive."
      />
    );
  }

  // Aim for roughly six labelled ticks whatever the range length.
  const interval = Math.max(0, Math.ceil(data.length / 6) - 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={TIMELINE_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          interval={interval}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
          tickMargin={8}
          minTickGap={4}
        />
        <YAxis
          allowDecimals={false}
          width={40}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<TimelineTooltip />}
          cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          fill={`url(#${TIMELINE_GRADIENT_ID})`}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Bar chart                                  */
/* -------------------------------------------------------------------------- */

function CountTooltip({ active, payload }: TooltipRenderProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as CountDatum | undefined;
  if (!row) return null;
  return (
    <div className={TOOLTIP_SHELL}>
      <p className="max-w-56 font-medium break-words text-slate-900">{row.label}</p>
      <p className="mt-0.5 text-slate-500">{pluralize(row.count, "response")}</p>
    </div>
  );
}

export function OptionBarChart({ data }: { data: CountDatum[] }) {
  const height = Math.min(460, Math.max(150, data.length * 40 + 28));
  if (isBlank(data)) {
    return <ChartEmpty height={180} message="No answers recorded for this question yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 20, bottom: 4, left: 0 }}
        barCategoryGap="22%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={124}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: string) => truncate(String(value), 18)}
        />
        <Tooltip content={<CountTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
          {data.map((row, i) => (
            <Cell key={`${row.label}-${i}`} fill={chartColor(i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Pie chart                                  */
/* -------------------------------------------------------------------------- */

function PieTooltip({ active, payload, total }: TooltipRenderProps & { total?: number }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as CountDatum | undefined;
  if (!row) return null;
  const share = total ? Math.round((row.count / total) * 1000) / 10 : 0;
  return (
    <div className={TOOLTIP_SHELL}>
      <p className="max-w-56 font-medium break-words text-slate-900">{row.label}</p>
      <p className="mt-0.5 text-slate-500">
        {pluralize(row.count, "response")} · {share}%
      </p>
    </div>
  );
}

export function OptionPieChart({ data }: { data: CountDatum[] }) {
  const height = 280;
  if (isBlank(data)) {
    return <ChartEmpty height={180} message="No answers recorded for this question yet." />;
  }

  const slices = data.filter((d) => d.count > 0);
  const total = slices.reduce((sum, d) => sum + d.count, 0);
  // Keep colours aligned with the bar view / legend, which use the original order.
  const colorByLabel = new Map(data.map((d, i) => [d.label, chartColor(i)]));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Pie
          data={slices}
          dataKey="count"
          nameKey="label"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={slices.length > 1 ? 2 : 0}
          stroke="#ffffff"
          strokeWidth={2}
          isAnimationActive
        >
          {slices.map((row, i) => (
            <Cell key={`${row.label}-${i}`} fill={colorByLabel.get(row.label) ?? chartColor(i)} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip total={total} />} />
        <Legend
          iconType="circle"
          iconSize={9}
          wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
          formatter={(value: unknown) => (
            <span className="text-[12px] text-slate-600">{truncate(String(value), 22)}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
