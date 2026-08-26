"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MousePointerClick, Plus } from "lucide-react";
import { CanvasField } from "@/components/builder/CanvasField";
import { useBuilder } from "@/components/builder/builder-context";
import { LIMITS, isAnswerable } from "@/lib/constants";
import { themeToCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";

const FALLBACK_TITLE = "Untitled form";

/** Chrome gutter that leaves room for each field's drag handle. */
const GUTTER = "pl-6";
/** The header inputs carry their own px-2, so they need 8px less gutter to line up. */
const HEADER_GUTTER = "pl-4";

export interface BuilderCanvasProps {
  /** Index a palette drag would drop into, or null when nothing is dragging. */
  insertIndex?: number | null;
  draggingFromPalette?: boolean;
}

export function BuilderCanvas({
  insertIndex = null,
  draggingFromPalette = false,
}: BuilderCanvasProps) {
  const { form, updateForm, addField, select } = useBuilder();
  const { theme, settings, fields } = form;

  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields]);

  /** Question numbers must match the live form exactly. */
  const questionNumbers = useMemo(() => {
    const map = new Map<string, number | null>();
    let counter = 0;
    for (const field of fields) {
      const answerable = isAnswerable(field.type);
      if (answerable) counter += 1;
      map.set(field.id, theme.showQuestionNumbers && answerable ? counter : null);
    }
    return map;
  }, [fields, theme.showQuestionNumbers]);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [form.description, theme.fontSize, theme.maxWidth]);

  const atLimit = fields.length >= LIMITS.maxFields;

  const handleBackgroundMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-canvas-field]")) return;
    select(null);
  };

  const editableChrome =
    "w-full rounded-lg border border-transparent bg-transparent transition-colors " +
    "hover:border-[color:var(--ncf-border)] focus:border-[color:var(--ncf-primary)] " +
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--ncf-primary-ring)] " +
    "placeholder:text-[color:var(--ncf-muted)] placeholder:opacity-60";

  return (
    <div
      className="px-3 py-6 sm:px-6 sm:py-10"
      onMouseDown={handleBackgroundMouseDown}
    >
      <div
        className="ncf-root"
        style={themeToCssVars(theme)}
        data-input-style={theme.inputStyle}
        data-button-style={theme.buttonStyle}
      >
        <div className="ncf-card">
          {theme.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ncf-cover" src={theme.coverImageUrl} alt="" />
          ) : null}

          <div className="ncf-card-body">
            <div className={cn("ncf-header", HEADER_GUTTER)}>
              <label className="sr-only" htmlFor="canvas-form-title">
                Form title
              </label>
              <input
                id="canvas-form-title"
                className={cn("ncf-title", editableChrome, "px-2 py-0.5")}
                style={{ fontFamily: "inherit" }}
                value={form.title}
                maxLength={LIMITS.titleMax}
                placeholder={FALLBACK_TITLE}
                onChange={(e) => updateForm({ title: e.target.value })}
                onBlur={(e) => {
                  if (!e.target.value.trim()) updateForm({ title: FALLBACK_TITLE });
                }}
              />

              <label className="sr-only" htmlFor="canvas-form-description">
                Form description
              </label>
              <textarea
                id="canvas-form-description"
                ref={descriptionRef}
                rows={1}
                className={cn(
                  "ncf-description",
                  editableChrome,
                  "block resize-none overflow-hidden px-2 py-0.5",
                )}
                style={{ fontFamily: "inherit" }}
                value={form.description}
                maxLength={LIMITS.descriptionMax}
                placeholder="Add a short description (optional)"
                onChange={(e) => updateForm({ description: e.target.value })}
              />
            </div>

            {fields.length === 0 ? (
              <EmptyCanvas
                active={draggingFromPalette}
                onAdd={() => addField("text")}
              />
            ) : (
              <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                <div className="ncf-grid">
                  {fields.map((field, index) => (
                    <Fragment key={field.id}>
                      {draggingFromPalette && insertIndex === index ? (
                        <InsertMarker />
                      ) : null}
                      <CanvasField
                        field={field}
                        index={index}
                        questionNumber={questionNumbers.get(field.id) ?? null}
                      />
                    </Fragment>
                  ))}
                  {draggingFromPalette &&
                  insertIndex !== null &&
                  insertIndex >= fields.length ? (
                    <InsertMarker />
                  ) : null}
                </div>
              </SortableContext>
            )}

            {fields.length > 0 ? (
              <button
                type="button"
                onClick={() => addField("text")}
                disabled={atLimit}
                title={
                  atLimit
                    ? `A form can hold up to ${LIMITS.maxFields} fields`
                    : "Append a short text field"
                }
                style={{ marginTop: "var(--ncf-gap)" }}
                className={cn(
                  GUTTER,
                  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed",
                  "border-[color:var(--ncf-border)] py-3 pr-6 text-[13px] font-medium text-[color:var(--ncf-muted)]",
                  "transition-colors hover:border-[color:var(--ncf-primary)] hover:text-[color:var(--ncf-primary)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ncf-primary-ring)]",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <Plus className="size-4" aria-hidden />
                Add a field
              </button>
            ) : null}

            <div
              className="ncf-actions pointer-events-none select-none"
              data-align={theme.buttonAlign}
              aria-hidden
            >
              <span className="ncf-submit">
                {settings.submitButtonText || "Submit"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11.5px] text-slate-400">
        This is the editing canvas — open Preview to try the real form.
      </p>
    </div>
  );
}

function InsertMarker() {
  return (
    <div className="ncf-col-full flex items-center gap-2" aria-hidden>
      <span className="h-0.5 flex-1 rounded-full bg-brand-500" />
      <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Drop here
      </span>
      <span className="h-0.5 flex-1 rounded-full bg-brand-500" />
    </div>
  );
}

function EmptyCanvas({
  active,
  onAdd,
}: {
  active: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
        active
          ? "border-brand-500 bg-brand-50/70"
          : "border-[color:var(--ncf-border)]",
      )}
    >
      <span className="mb-3 grid size-11 place-items-center rounded-xl bg-[color:var(--ncf-primary-soft)] text-[color:var(--ncf-primary)]">
        <MousePointerClick className="size-5" aria-hidden />
      </span>
      <p className="text-[15px] font-semibold text-[color:var(--ncf-text)]">
        Your form is empty
      </p>
      <p className="mt-1 max-w-xs text-[13px] text-[color:var(--ncf-muted)]">
        Drag a field from the library on the left, or click any field there to
        append it.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[color:var(--ncf-primary)] px-3.5 py-2 text-[13px] font-semibold text-[color:var(--ncf-primary-contrast)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ncf-primary-ring)]"
      >
        <Plus className="size-4" aria-hidden />
        Add your first field
      </button>
    </div>
  );
}
