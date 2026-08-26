"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Asterisk,
  Columns2,
  Columns3,
  Copy,
  GripVertical,
  RectangleHorizontal,
  Trash2,
} from "lucide-react";
import { useBuilder } from "@/components/builder/builder-context";
import { FieldRenderer } from "@/components/form/FieldRenderer";
import { FIELD_META, isAnswerable } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AnswerValue, FieldWidth, FormField } from "@/lib/types";

const WIDTH_CLASS: Record<FieldWidth, string> = {
  full: "ncf-col-full",
  half: "ncf-col-half",
  third: "ncf-col-third",
};

const NEXT_WIDTH: Record<FieldWidth, FieldWidth> = {
  full: "half",
  half: "third",
  third: "full",
};

const WIDTH_LABEL: Record<FieldWidth, string> = {
  full: "Full width",
  half: "Half width",
  third: "Third width",
};

const WIDTH_ICON: Record<FieldWidth, typeof Columns2> = {
  full: RectangleHorizontal,
  half: Columns2,
  third: Columns3,
};

/** A representative value so the canvas shows the field exactly as respondents see it. */
function previewValue(field: FormField): AnswerValue {
  if (field.defaultValue !== undefined && field.defaultValue !== null) {
    return field.defaultValue as AnswerValue;
  }
  switch (field.type) {
    case "multiselect":
    case "checkboxGroup":
      return [];
    case "checkbox":
      return false;
    case "range":
      return field.validation?.min ?? 0;
    case "rating":
    case "number":
      return null;
    default:
      return "";
  }
}

export interface CanvasFieldProps {
  field: FormField;
  index: number;
  /** 1-based number when the theme shows question numbers. */
  questionNumber?: number | null;
}

export function CanvasField({ field, index, questionNumber = null }: CanvasFieldProps) {
  const { selectedFieldId, select, updateField, copyField, removeField } = useBuilder();
  const selected = selectedFieldId === field.id;
  const meta = FIELD_META[field.type];
  const WidthIcon = WIDTH_ICON[field.width];

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, data: { source: "canvas", index } });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(field.id);
    } else if (selected && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      removeField(field.id);
    }
  };

  const chromeVisible = cn(
    "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
    selected && "opacity-100",
  );

  return (
    <div
      ref={setNodeRef}
      data-canvas-field={field.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group @container relative",
        WIDTH_CLASS[field.width],
        isDragging && "z-10 opacity-50",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${meta.name}: ${field.label || "Untitled field"}. Select to edit.`}
        onClick={() => select(field.id)}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative cursor-pointer rounded-xl border py-2.5 pl-6 pr-2.5 transition-colors",
          selected
            ? "border-transparent bg-brand-500/[0.04] ring-2 ring-brand-500"
            : "border-transparent hover:border-slate-300 hover:bg-slate-500/[0.04]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          isDragging &&
            "border-2 border-dashed border-brand-400 bg-brand-50/60 ring-0 hover:border-brand-400",
        )}
      >
        {/* The real renderer, made inert so the card keeps the click. */}
        <div className="pointer-events-none">
          <FieldRenderer
            field={field}
            value={previewValue(field)}
            onChange={() => {}}
            questionNumber={questionNumber}
            disabled
            idPrefix={`canvas-${field.id}`}
          />
        </div>
      </div>

      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Reorder ${field.label || meta.name}`}
        title="Drag to reorder"
        className={cn(
          "absolute left-0 top-3 z-20 flex h-7 w-5 cursor-grab touch-none items-center justify-center rounded-md",
          "text-slate-400 hover:bg-slate-900/5 hover:text-slate-600 active:cursor-grabbing",
          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          chromeVisible,
        )}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <span
        className={cn(
          "pointer-events-none absolute -top-2.5 left-5 z-10 hidden select-none rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white @[200px]:block",
          selected ? "bg-brand-600" : "bg-slate-700",
          selected ? "opacity-100" : chromeVisible,
        )}
      >
        {selected ? "Selected" : meta.name}
      </span>

      <div
        className={cn(
          "absolute -top-3.5 right-1 z-20 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm shadow-slate-900/10",
          chromeVisible,
          !selected && "pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto",
        )}
      >
        {isAnswerable(field.type) ? (
          <>
            <button
              type="button"
              aria-pressed={field.required}
              title={
                field.required
                  ? "Required — click to make optional"
                  : "Optional — click to make required"
              }
              onClick={() => {
                select(field.id);
                updateField(field.id, { required: !field.required });
              }}
              className={cn(
                "flex h-6 cursor-pointer items-center gap-0.5 rounded-md px-1.5 text-[11px] font-semibold transition-colors",
                field.required
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
              )}
            >
              <Asterisk className="size-3 @[280px]:hidden" aria-hidden />
              <span className="hidden @[280px]:inline">Required</span>
            </button>
            <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden />
          </>
        ) : null}

        <ToolbarButton
          label={`${WIDTH_LABEL[field.width]} — click for ${WIDTH_LABEL[NEXT_WIDTH[field.width]].toLowerCase()}`}
          onClick={() => {
            select(field.id);
            updateField(field.id, { width: NEXT_WIDTH[field.width] });
          }}
        >
          <WidthIcon className="size-3.5" aria-hidden />
        </ToolbarButton>

        <ToolbarButton label="Duplicate field" onClick={() => copyField(field.id)}>
          <Copy className="size-3.5" aria-hidden />
        </ToolbarButton>

        <ToolbarButton
          label="Delete field"
          tone="danger"
          onClick={() => removeField(field.id)}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </ToolbarButton>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors",
        tone === "danger"
          ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}
