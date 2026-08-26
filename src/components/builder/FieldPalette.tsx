"use client";

import { useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useBuilder } from "@/components/builder/builder-context";
import { useToast } from "@/components/ui/Toast";
import { FIELD_GROUPS, FIELD_META, LIMITS } from "@/lib/constants";
import { FIELD_ICONS } from "@/lib/field-icons";
import { cn } from "@/lib/utils";
import type { FieldType } from "@/lib/types";

/** Pointer travel (px) above which a press counts as a drag, not a click. */
const CLICK_SLOP = 6;

export function FieldPalette({
  className,
  onAdd,
}: {
  className?: string;
  onAdd?: () => void;
}) {
  const { form, addField } = useBuilder();
  const toast = useToast();

  const append = (type: FieldType) => {
    if (form.fields.length >= LIMITS.maxFields) {
      toast.error(
        "Field limit reached",
        `A form can hold up to ${LIMITS.maxFields} fields.`,
      );
      return;
    }
    addField(type);
    onAdd?.();
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex-none border-b border-slate-100 px-4 py-3">
        <h2 className="text-[13px] font-semibold text-slate-900">Add a field</h2>
        <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
          Drag a field onto the canvas, or click to append.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        {FIELD_GROUPS.map(({ group, types }) => (
          <section key={group}>
            <h3 className="sticky top-0 z-10 bg-white/90 px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-sm">
              {group}
            </h3>
            <ul className="space-y-0.5 px-2">
              {types.map((type) => (
                <li key={type}>
                  <PaletteItem type={type} onAppend={() => append(type)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function PaletteItem({
  type,
  onAppend,
}: {
  type: FieldType;
  onAppend: () => void;
}) {
  const meta = FIELD_META[type];
  const Icon = FIELD_ICONS[type];
  const origin = useRef<{ x: number; y: number } | null>(null);

  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: "palette", fieldType: type },
  });

  // Only the pointer activator is wired up: pressing Enter/Space on a palette
  // item must append the field rather than start a keyboard drag.
  const startDrag = listeners?.onPointerDown as
    | ((event: React.PointerEvent<HTMLButtonElement>) => void)
    | undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      title={meta.description}
      onPointerDown={(e) => {
        origin.current = { x: e.clientX, y: e.clientY };
        startDrag?.(e);
      }}
      onClick={(e) => {
        // A press that travelled was a drag attempt — don't also append.
        const from = origin.current;
        origin.current = null;
        if (
          from &&
          Math.hypot(e.clientX - from.x, e.clientY - from.y) > CLICK_SLOP
        ) {
          return;
        }
        onAppend();
      }}
      className={cn(
        "group flex w-full cursor-grab items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-left transition-colors",
        "hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <span className="grid size-8 flex-none place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-700 group-hover:text-slate-900">
        {meta.name}
      </span>
      <Plus
        className="size-4 flex-none text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden
      />
    </button>
  );
}
