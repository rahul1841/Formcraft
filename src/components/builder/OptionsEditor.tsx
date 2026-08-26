"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
import { LIMITS } from "@/lib/constants";
import { createOption } from "@/lib/fields";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/components/builder/builder-context";
import { Button } from "@/components/ui/Button";
import type { FieldOption, FormField } from "@/lib/types";

const ROW_BUTTON =
  "grid size-7 flex-none cursor-pointer place-items-center rounded-md text-slate-400 transition-colors " +
  "hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 " +
  "disabled:pointer-events-none disabled:opacity-30";

function nextOptionLabel(options: FieldOption[]): string {
  const taken = new Set(options.map((o) => o.label.trim().toLowerCase()));
  let n = options.length + 1;
  while (taken.has(`option ${n}`)) n += 1;
  return `Option ${n}`;
}

export function OptionsEditor({ field }: { field: FormField }) {
  const { updateField } = useBuilder();
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  // Id of an option that was just added and should receive the caret.
  const pendingFocus = useRef<string | null>(null);

  const options = field.options ?? [];
  const atLimit = options.length >= LIMITS.maxOptions;

  // Focus (and select) an option that was just created so authors can type
  // straight over the placeholder label.
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const input = listRef.current?.querySelector<HTMLInputElement>(
      `input[data-option-id="${id}"]`,
    );
    input?.focus();
    input?.select();
  }, [options.length]);

  const commit = (next: FieldOption[]) =>
    updateField(field.id, { options: next.slice(0, LIMITS.maxOptions) });

  const rename = (id: string, label: string) =>
    commit(
      options.map((o) =>
        o.id === id
          ? // Keep value pinned to the label until someone deliberately breaks
            // the pair, so existing responses stay matched to their option.
            // An empty value would collide with "no answer" and render the row
            // pre-selected on the live form, so the old value is kept instead.
            {
              ...o,
              label,
              value:
                o.value === o.label ? label.trim() || o.value : o.value,
            }
          : o,
      ),
    );

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const remove = (id: string) => {
    if (options.length <= 1) return;
    commit(options.filter((o) => o.id !== id));
  };

  const add = (afterIndex?: number) => {
    if (atLimit) return;
    const option = createOption(nextOptionLabel(options));
    const next = [...options];
    next.splice(afterIndex === undefined ? next.length : afterIndex + 1, 0, option);
    pendingFocus.current = option.id;
    commit(next);
  };

  const parsedPaste = pasteText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, LIMITS.maxOptions);

  const applyPaste = (mode: "replace" | "append") => {
    if (!parsedPaste.length) return;
    const created = parsedPaste.map((label) => createOption(label));
    commit(mode === "replace" ? created : [...options, ...created]);
    setPasteText("");
    setPasting(false);
  };

  const counts = options.reduce<Record<string, number>>((acc, option) => {
    const key = option.value.trim().toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(counts).some((n) => n > 1);
  const isDuplicate = (option: FieldOption) =>
    counts[option.value.trim().toLowerCase()] > 1;
  const isBlank = (option: FieldOption) => option.label.trim() === "";
  const hasBlanks = options.some(isBlank);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-700">
          Choices
          <span className="ml-1.5 font-normal tabular-nums text-slate-400">
            {options.length}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setPasting((v) => !v)}
          aria-expanded={pasting}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
            pasting
              ? "text-brand-700"
              : "text-slate-500 hover:text-slate-800",
          )}
        >
          <ClipboardList className="size-3.5" aria-hidden />
          Paste a list
        </button>
      </div>

      {options.length ? (
        <ul ref={listRef} className="space-y-1.5">
          {options.map((option, index) => {
            const duplicate = isDuplicate(option);
            const blank = isBlank(option);
            return (
              <li key={option.id} className="flex items-center gap-1">
                <input
                  data-option-id={option.id}
                  value={option.label}
                  maxLength={LIMITS.optionLabelMax}
                  aria-label={`Option ${index + 1}`}
                  aria-invalid={duplicate || blank || undefined}
                  placeholder={`Option ${index + 1}`}
                  onChange={(e) => rename(option.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add(index);
                    }
                  }}
                  className={cn(
                    "h-8.5 w-full min-w-0 rounded-lg border bg-white px-2.5 text-[13px] text-slate-900 shadow-xs transition-all",
                    "placeholder:text-slate-400 focus:outline-none focus:ring-4",
                    duplicate || blank
                      ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/15"
                      : "border-slate-300 focus:border-brand-500 focus:ring-brand-500/15",
                  )}
                />
                <button
                  type="button"
                  className={ROW_BUTTON}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                  aria-label={`Move option ${index + 1} up`}
                >
                  <ArrowUp className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className={ROW_BUTTON}
                  onClick={() => move(index, 1)}
                  disabled={index === options.length - 1}
                  title="Move down"
                  aria-label={`Move option ${index + 1} down`}
                >
                  <ArrowDown className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className={cn(ROW_BUTTON, "hover:bg-red-50 hover:text-red-600")}
                  onClick={() => remove(option.id)}
                  disabled={options.length <= 1}
                  title={
                    options.length <= 1
                      ? "A choice field needs at least one option"
                      : "Remove option"
                  }
                  aria-label={`Remove option ${index + 1}`}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center text-[12.5px] text-slate-500">
          No options yet — add the first one below.
        </p>
      )}

      {hasBlanks ? (
        <p className="flex items-start gap-1.5 text-[12.5px] font-medium text-amber-600">
          <TriangleAlert className="mt-px size-3.5 flex-none" aria-hidden />
          An option with no text will render blank on the live form. Give it a
          label or remove it.
        </p>
      ) : null}

      {hasDuplicates ? (
        <p className="flex items-start gap-1.5 text-[12.5px] font-medium text-amber-600">
          <TriangleAlert className="mt-px size-3.5 flex-none" aria-hidden />
          Two options share the same value. Responses for them will be counted
          together in your analytics.
        </p>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => add()}
        disabled={atLimit}
        icon={<Plus className="size-4" />}
      >
        Add option
      </Button>

      {atLimit ? (
        <p className="text-[12.5px] text-slate-500">
          You&rsquo;ve reached the maximum of {LIMITS.maxOptions} options.
        </p>
      ) : null}

      {pasting ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label
            htmlFor={`paste-${field.id}`}
            className="block text-[12.5px] font-medium text-slate-700"
          >
            One option per line
          </label>
          <textarea
            id={`paste-${field.id}`}
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Small\nMedium\nLarge"}
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[13px] leading-relaxed text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => applyPaste("replace")}
              disabled={!parsedPaste.length}
            >
              Replace options
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPaste("append")}
              disabled={!parsedPaste.length || atLimit}
            >
              Append
            </Button>
            <span className="ml-auto text-[12px] tabular-nums text-slate-500">
              {parsedPaste.length}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
