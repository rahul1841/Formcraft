"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Copy,
  Minus,
  Trash2,
} from "lucide-react";
import { FIELD_META, LIMITS, hasOptions } from "@/lib/constants";
import { FIELD_ICONS } from "@/lib/field-icons";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/components/builder/builder-context";
import { OptionsEditor } from "@/components/builder/OptionsEditor";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { RangeControl } from "@/components/ui/RangeControl";
import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import type { Align, FieldType, FieldWidth, FormField } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*         Small building blocks shared by the three inspector panels          */
/* -------------------------------------------------------------------------- */

/** One labelled block of the inspector. Sections are separated by a hairline. */
export function Section({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3 px-4 py-4", className)}>
      {title ? (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Label + hint around a control that isn't a native form element. */
export function Labeled({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="block text-[13px] font-medium text-slate-700">
        {label}
      </span>
      {children}
      {hint ? <p className="text-[12.5px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

/**
 * Numeric input that reports `undefined` when emptied instead of NaN, keeps its
 * own draft string so intermediate values stay editable, and rounds + clamps to
 * min/max on blur (correcting while typing would fight the caret). A draft that
 * is still out of range — or fractional on an integer field — is held back
 * rather than pushed up, so a half-typed number never reaches the autosave and
 * gets rejected by the form schema.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  integer,
  placeholder,
  hint,
  className,
}: {
  label: ReactNode;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  /** Round to a whole number — for the values stored by an `.int()` schema. */
  integer?: boolean;
  placeholder?: string;
  hint?: ReactNode;
  className?: string;
}) {
  const [draft, setDraft] = useState(() =>
    value === undefined || value === null ? "" : String(value),
  );
  // Tracks the last value this input pushed up, so external changes (undo,
  // switching fields, a preset) resync the draft but our own edits don't.
  const pushed = useRef<number | undefined>(value ?? undefined);

  useEffect(() => {
    const next = value ?? undefined;
    if (next !== pushed.current) {
      pushed.current = next;
      setDraft(next === undefined ? "" : String(next));
    }
  }, [value]);

  const push = (next: number | undefined) => {
    pushed.current = next;
    onChange(next);
  };

  const handleChange = (raw: string) => {
    setDraft(raw);
    if (raw.trim() === "") {
      push(undefined);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    if (integer && !Number.isInteger(parsed)) return;
    if (min !== undefined && parsed < min) return;
    if (max !== undefined && parsed > max) return;
    push(parsed);
  };

  const handleBlur = () => {
    if (draft.trim() === "") return;
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(value === undefined || value === null ? "" : String(value));
      return;
    }
    let next = integer ? Math.round(parsed) : parsed;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    if (next !== parsed) setDraft(String(next));
    // handleChange holds back drafts it couldn't legally push, so blur has to
    // send the corrected value even when it changed nothing here.
    if (next !== pushed.current) push(next);
  };

  return (
    <Input
      type="number"
      inputMode="decimal"
      label={label}
      hint={hint}
      value={draft}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      wrapperClassName={className}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                  */
/* -------------------------------------------------------------------------- */

/** Types whose renderer actually shows a placeholder. */
const PLACEHOLDER_TYPES: FieldType[] = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "url",
  "select",
];

/** Types where a plain typed default makes sense. */
const TEXT_DEFAULT_TYPES: FieldType[] = [
  "text",
  "textarea",
  "email",
  "phone",
  "url",
  "date",
  "time",
];

const WIDTH_OPTIONS: SegmentOption<FieldWidth>[] = [
  { value: "full", label: "Full" },
  { value: "half", label: "Half" },
  { value: "third", label: "Third" },
];

const ALIGN_OPTIONS: SegmentOption<Align>[] = [
  { value: "left", icon: <AlignLeft className="size-4" />, title: "Align left" },
  {
    value: "center",
    icon: <AlignCenter className="size-4" />,
    title: "Align centre",
  },
  {
    value: "right",
    icon: <AlignRight className="size-4" />,
    title: "Align right",
  },
];

const LAYOUT_OPTIONS: SegmentOption<"vertical" | "horizontal" | "grid">[] = [
  { value: "vertical", label: "List" },
  { value: "horizontal", label: "Inline" },
  { value: "grid", label: "Grid" },
];

const HEADING_OPTIONS: SegmentOption<"1" | "2" | "3">[] = [
  { value: "1", label: "H1" },
  { value: "2", label: "H2" },
  { value: "3", label: "H3" },
];

const TEXT_INPUT_TYPE: Partial<Record<FieldType, string>> = {
  email: "email",
  phone: "tel",
  url: "url",
  date: "date",
  time: "time",
};

/* -------------------------------------------------------------------------- */
/*                                    Panel                                    */
/* -------------------------------------------------------------------------- */

export function FieldSettingsPanel() {
  const { selectedField, updateField, removeField, copyField } = useBuilder();
  // Tracks the field whose advanced section is open, so it collapses again as
  // soon as another field is selected.
  const [advancedFor, setAdvancedFor] = useState<string | null>(null);

  if (!selectedField) return null;

  const field: FormField = selectedField;
  const meta = FIELD_META[field.type];
  const Icon = FIELD_ICONS[field.type];
  const advancedOpen = advancedFor === field.id;
  const set = (patch: Partial<FormField>) => updateField(field.id, patch);
  const setValidation = (patch: Partial<NonNullable<FormField["validation"]>>) =>
    set({ validation: { ...field.validation, ...patch } });

  const isStatic =
    field.type === "heading" ||
    field.type === "paragraph" ||
    field.type === "divider";
  const choice = hasOptions(field.type);
  const isTextish = field.type === "text" || field.type === "textarea";
  const isMulti =
    field.type === "multiselect" || field.type === "checkboxGroup";
  const rangeMin = field.validation?.min ?? 0;
  const rangeMax = field.validation?.max ?? 100;

  /**
   * The slider's two bounds move as a pair — an inverted min/max leaves the
   * native range input with no travel and makes every answer invalid — and the
   * default is re-clamped into the new scale so it can't be stranded outside.
   */
  const setRangeBound = (key: "min" | "max", next: number | undefined) => {
    const min = key === "min" ? next : field.validation?.min;
    const max = key === "max" ? next : field.validation?.max;
    const lo = min ?? 0;
    const hi = max ?? 100;
    const bounds =
      key === "min"
        ? { min, max: hi < lo ? lo : max }
        : { min: lo > hi ? hi : min, max };
    const patch: Partial<FormField> = {
      validation: { ...field.validation, ...bounds },
    };
    if (typeof field.defaultValue === "number") {
      const clamped = Math.min(
        Math.max(field.defaultValue, bounds.min ?? 0),
        bounds.max ?? 100,
      );
      if (clamped !== field.defaultValue) patch.defaultValue = clamped;
    }
    set(patch);
  };

  const showDefault =
    TEXT_DEFAULT_TYPES.includes(field.type) ||
    field.type === "number" ||
    field.type === "select" ||
    field.type === "radio" ||
    field.type === "checkbox";

  return (
    <div>
      {/* ------------------------------- header ------------------------------ */}
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <span className="grid size-8 flex-none place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {meta.name}
          </p>
          <p className="truncate text-[12px] text-slate-500">
            {meta.description}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Duplicate field"
          aria-label="Duplicate field"
          onClick={() => copyField(field.id)}
          icon={<Copy className="size-4" />}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="hover:bg-red-50 hover:text-red-600"
          title="Delete field"
          aria-label="Delete field"
          onClick={() => removeField(field.id)}
          icon={<Trash2 className="size-4" />}
        />
      </div>

      <div className="divide-y divide-slate-100 pb-10">
        {/* ------------------------- static field types ------------------------ */}
        {field.type === "divider" ? (
          <Section title="Divider">
            <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Minus className="mt-0.5 size-4 flex-none text-slate-400" aria-hidden />
              <p className="text-[12.5px] leading-relaxed text-slate-600">
                A divider draws a line between sections of your form. It has no
                settings and never asks the respondent for an answer — drag it
                where you want the break.
              </p>
            </div>
          </Section>
        ) : null}

        {field.type === "heading" || field.type === "paragraph" ? (
          <Section title="Content">
            <Textarea
              label={field.type === "heading" ? "Heading text" : "Paragraph text"}
              rows={field.type === "heading" ? 2 : 4}
              maxLength={3000}
              value={field.content ?? ""}
              placeholder={
                field.type === "heading"
                  ? "Section heading"
                  : "Add a short description or instructions here."
              }
              onChange={(e) => set({ content: e.target.value })}
            />
            {field.type === "heading" ? (
              <Labeled label="Heading level">
                <SegmentedControl
                  value={String(field.headingLevel ?? 2) as "1" | "2" | "3"}
                  options={HEADING_OPTIONS}
                  onChange={(v) =>
                    set({ headingLevel: Number(v) as 1 | 2 | 3 })
                  }
                />
              </Labeled>
            ) : null}
          </Section>
        ) : null}

        {/* ---------------------------- answer fields --------------------------- */}
        {!isStatic ? (
          <>
            <Section title="Content">
              <Input
                label="Label"
                value={field.label}
                maxLength={LIMITS.labelMax}
                placeholder="What are you asking?"
                onChange={(e) => set({ label: e.target.value })}
              />

              {field.type === "checkbox" ? (
                <Input
                  label="Checkbox text"
                  value={field.checkboxLabel ?? ""}
                  maxLength={600}
                  placeholder="I agree to the terms and conditions"
                  hint="Shown next to the box; the label above sits on top."
                  onChange={(e) => set({ checkboxLabel: e.target.value })}
                />
              ) : null}

              {PLACEHOLDER_TYPES.includes(field.type) ? (
                <Input
                  label="Placeholder"
                  value={field.placeholder ?? ""}
                  maxLength={300}
                  placeholder={
                    field.type === "select" ? "Select an option" : "Type your answer"
                  }
                  hint={
                    field.type === "select"
                      ? "Used as the first, empty choice."
                      : undefined
                  }
                  onChange={(e) => set({ placeholder: e.target.value })}
                />
              ) : null}

              <Textarea
                label="Help text"
                rows={2}
                maxLength={600}
                value={field.helpText ?? ""}
                placeholder="Optional guidance shown under the field"
                onChange={(e) => set({ helpText: e.target.value })}
              />
            </Section>

            {/* ------------------------------ options ----------------------------- */}
            {choice ? (
              <Section title="Options">
                <OptionsEditor field={field} />
                <Labeled label="Option layout">
                  <SegmentedControl
                    value={
                      field.optionLayout ??
                      (field.type === "multiselect" ? "horizontal" : "vertical")
                    }
                    options={LAYOUT_OPTIONS}
                    onChange={(v) => set({ optionLayout: v })}
                  />
                </Labeled>
              </Section>
            ) : null}

            {/* ------------------------------- scale ------------------------------ */}
            {field.type === "rating" ? (
              <Section title="Scale">
                <RangeControl
                  label="Maximum stars"
                  min={3}
                  max={10}
                  value={field.maxRating ?? 5}
                  onChange={(v) => set({ maxRating: v })}
                />
              </Section>
            ) : null}

            {field.type === "range" ? (
              <Section title="Scale">
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Minimum"
                    value={field.validation?.min}
                    onChange={(v) => setRangeBound("min", v)}
                    placeholder="0"
                  />
                  <NumberField
                    label="Maximum"
                    value={field.validation?.max}
                    onChange={(v) => setRangeBound("max", v)}
                    placeholder="100"
                  />
                </div>
                {rangeMin > rangeMax ? (
                  <p className="text-[12.5px] font-medium text-red-600">
                    Minimum is above Maximum, so the slider can’t move and no
                    answer is accepted. Raise the maximum above {rangeMin}.
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Step"
                    value={field.step}
                    min={0.001}
                    max={1000}
                    step="any"
                    onChange={(v) => set({ step: v })}
                    placeholder="1"
                  />
                  <NumberField
                    label="Default"
                    value={
                      typeof field.defaultValue === "number"
                        ? field.defaultValue
                        : undefined
                    }
                    min={Math.min(rangeMin, rangeMax)}
                    max={Math.max(rangeMin, rangeMax)}
                    onChange={(v) => set({ defaultValue: v ?? null })}
                    placeholder={String(rangeMin)}
                  />
                </div>
              </Section>
            ) : null}

            {field.type === "textarea" ? (
              <Section title="Size">
                <RangeControl
                  label="Rows"
                  min={2}
                  max={12}
                  value={field.rows ?? 4}
                  onChange={(v) => set({ rows: v })}
                />
              </Section>
            ) : null}

            {/* ------------------------------ answer ------------------------------ */}
            <Section title="Answer">
              <Switch
                label="Required"
                description="The respondent can't submit without answering."
                checked={field.required}
                onChange={(v) => set({ required: v })}
              />

              {showDefault ? (
                <div className="pt-1">
                  {field.type === "checkbox" ? (
                    <Switch
                      label="Ticked by default"
                      checked={field.defaultValue === true}
                      onChange={(v) => set({ defaultValue: v })}
                    />
                  ) : field.type === "select" || field.type === "radio" ? (
                    <Select
                      label="Default value"
                      value={
                        typeof field.defaultValue === "string"
                          ? field.defaultValue
                          : ""
                      }
                      options={[
                        { value: "", label: "No default" },
                        ...(field.options ?? []).map((o) => ({
                          value: o.value,
                          label: o.label || o.value,
                        })),
                      ]}
                      onChange={(e) =>
                        set({
                          defaultValue:
                            e.target.value === "" ? null : e.target.value,
                        })
                      }
                    />
                  ) : field.type === "number" ? (
                    <NumberField
                      label="Default value"
                      value={
                        typeof field.defaultValue === "number"
                          ? field.defaultValue
                          : undefined
                      }
                      min={field.validation?.min}
                      max={field.validation?.max}
                      onChange={(v) => set({ defaultValue: v ?? null })}
                    />
                  ) : (
                    <Input
                      label="Default value"
                      type={TEXT_INPUT_TYPE[field.type] ?? "text"}
                      value={
                        typeof field.defaultValue === "string"
                          ? field.defaultValue
                          : ""
                      }
                      maxLength={300}
                      placeholder="Empty"
                      onChange={(e) =>
                        set({ defaultValue: e.target.value || null })
                      }
                    />
                  )}
                </div>
              ) : null}
            </Section>

            {/* ---------------------------- validation ---------------------------- */}
            {isTextish || field.type === "number" || isMulti ? (
              <Section title="Validation">
                {isTextish ? (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Min length"
                      value={field.validation?.minLength}
                      min={0}
                      max={100000}
                      integer
                      onChange={(v) => setValidation({ minLength: v })}
                      placeholder="0"
                    />
                    <NumberField
                      label="Max length"
                      value={field.validation?.maxLength}
                      min={0}
                      max={100000}
                      integer
                      onChange={(v) => setValidation({ maxLength: v })}
                      placeholder="None"
                    />
                  </div>
                ) : null}

                {field.type === "number" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Minimum"
                      value={field.validation?.min}
                      onChange={(v) => setValidation({ min: v })}
                      placeholder="None"
                    />
                    <NumberField
                      label="Maximum"
                      value={field.validation?.max}
                      onChange={(v) => setValidation({ max: v })}
                      placeholder="None"
                    />
                  </div>
                ) : null}

                {isMulti ? (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Min choices"
                      value={field.validation?.minSelected}
                      min={0}
                      max={1000}
                      integer
                      onChange={(v) => setValidation({ minSelected: v })}
                      placeholder="0"
                    />
                    <NumberField
                      label="Max choices"
                      value={field.validation?.maxSelected}
                      min={0}
                      max={1000}
                      integer
                      onChange={(v) => setValidation({ maxSelected: v })}
                      placeholder="Any"
                    />
                  </div>
                ) : null}

                {isTextish ? (
                  <div className="rounded-xl border border-slate-200">
                    <button
                      type="button"
                      aria-expanded={advancedOpen}
                      onClick={() =>
                        setAdvancedFor(advancedOpen ? null : field.id)
                      }
                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                    >
                      Advanced validation
                      <ChevronDown
                        className={cn(
                          "size-4 text-slate-400 transition-transform",
                          advancedOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                    {advancedOpen ? (
                      <div className="space-y-3 border-t border-slate-100 px-3 py-3">
                        <Input
                          label="Pattern (regex)"
                          value={field.validation?.pattern ?? ""}
                          maxLength={300}
                          spellCheck={false}
                          placeholder="^[A-Z]{2}-\d{4}$"
                          className="font-mono text-[12.5px]"
                          hint="Answers must match this regular expression."
                          onChange={(e) =>
                            setValidation({ pattern: e.target.value || undefined })
                          }
                        />
                        <Input
                          label="Pattern message"
                          value={field.validation?.patternMessage ?? ""}
                          maxLength={300}
                          placeholder="Use the format AB-1234"
                          hint="Shown when the answer doesn't match."
                          onChange={(e) =>
                            setValidation({
                              patternMessage: e.target.value || undefined,
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Section>
            ) : null}

            {/* ------------------------------ layout ------------------------------ */}
            <Section title="Layout">
              <Labeled
                label="Width"
                hint="Half and third widths sit side by side on wide screens."
              >
                <SegmentedControl
                  value={field.width}
                  options={WIDTH_OPTIONS}
                  onChange={(v) => set({ width: v })}
                />
              </Labeled>
              <Labeled label="Alignment">
                <SegmentedControl
                  value={field.align}
                  options={ALIGN_OPTIONS}
                  onChange={(v) => set({ align: v })}
                />
              </Labeled>
            </Section>
          </>
        ) : null}
      </div>
    </div>
  );
}
