"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { LayoutGrid, Palette, Plus } from "lucide-react";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { FieldPalette } from "@/components/builder/FieldPalette";
import { InspectorPanel } from "@/components/builder/InspectorPanel";
import { PreviewModal } from "@/components/builder/PreviewModal";
import { useBuilder } from "@/components/builder/builder-context";
import { SegmentedControl, type SegmentOption } from "@/components/ui/SegmentedControl";
import { useToast } from "@/components/ui/Toast";
import { FIELD_META, LIMITS } from "@/lib/constants";
import { FIELD_ICONS } from "@/lib/field-icons";
import { cn } from "@/lib/utils";
import type { FieldType, FormField } from "@/lib/types";

type Pane = "add" | "build" | "style";

type ActiveDrag =
  | { source: "palette"; fieldType: FieldType }
  | { source: "canvas"; field: FormField };

interface DragData {
  source?: "palette" | "canvas";
  fieldType?: FieldType;
}

/** Read straight off the event so handlers never lag a render behind state. */
const dragData = (event: DragStartEvent | DragOverEvent | DragEndEvent) =>
  event.active.data.current as DragData | undefined;

const PANE_OPTIONS: SegmentOption<Pane>[] = [
  { value: "add", label: "Add", icon: <Plus className="size-4" /> },
  { value: "build", label: "Build", icon: <LayoutGrid className="size-4" /> },
  { value: "style", label: "Style", icon: <Palette className="size-4" /> },
];

/**
 * The canvas column is also a droppable so an empty form still accepts drops.
 * It is disabled once fields exist: closestCenter compares rect centres, and a
 * column-sized rect would otherwise win over the field the pointer is on.
 */
function CanvasDropArea({
  insertIndex,
  draggingFromPalette,
  hasFields,
}: {
  insertIndex: number | null;
  draggingFromPalette: boolean;
  hasFields: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas", disabled: hasFields });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-full transition-colors",
        draggingFromPalette && isOver && "bg-brand-50/60",
      )}
    >
      <BuilderCanvas
        insertIndex={insertIndex}
        draggingFromPalette={draggingFromPalette}
      />
    </div>
  );
}

export function FormBuilder() {
  const { form, addField, moveField } = useBuilder();
  const toast = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pane, setPane] = useState<Pane>("build");
  const [active, setActive] = useState<ActiveDrag | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  /**
   * closestCenter alone reports a collision for every droppable on the page, so
   * `event.over` was never null and releasing a palette drag anywhere — over the
   * palette itself, the inspector, the top bar — inserted a field. Requiring real
   * pointer containment first makes the "dropped outside" guard work again.
   */
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => (pointerWithin(args).length > 0 ? closestCenter(args) : []),
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fieldIds = useMemo(() => form.fields.map((f) => f.id), [form.fields]);

  /** Where a palette item would land: before or after the field it hovers. */
  const paletteInsertIndex = useCallback(
    (event: DragOverEvent | DragEndEvent) => {
      const over = event.over;
      if (!over || over.id === "canvas") return form.fields.length;

      const base = fieldIds.indexOf(String(over.id));
      if (base === -1) return form.fields.length;

      const dragged = event.active.rect.current.translated;
      if (!dragged) return base;

      const draggedCentre = dragged.top + dragged.height / 2;
      const overCentre = over.rect.top + over.rect.height / 2;
      return draggedCentre > overCentre ? base + 1 : base;
    },
    [fieldIds, form.fields.length],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = dragData(event);

    if (data?.source === "palette" && data.fieldType) {
      setActive({ source: "palette", fieldType: data.fieldType });
      setInsertIndex(form.fields.length);
      return;
    }
    const field = form.fields.find((f) => f.id === event.active.id);
    if (field) setActive({ source: "canvas", field });
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (dragData(event)?.source !== "palette") return;
    setInsertIndex(paletteInsertIndex(event));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const data = dragData(event);
    setActive(null);
    setInsertIndex(null);
    if (!event.over) return;

    if (data?.source === "palette" && data.fieldType) {
      if (form.fields.length >= LIMITS.maxFields) {
        toast.error(
          "Field limit reached",
          `A form can hold up to ${LIMITS.maxFields} fields.`,
        );
        return;
      }
      addField(data.fieldType, paletteInsertIndex(event));
      return;
    }

    const from = fieldIds.indexOf(String(event.active.id));
    const to = fieldIds.indexOf(String(event.over.id));
    if (from === -1 || to === -1 || from === to) return;
    moveField(from, to);
  };

  const handleDragCancel = () => {
    setActive(null);
    setInsertIndex(null);
  };

  // Stable so PreviewModal's open/close effect doesn't re-run (and steal focus)
  // every time the builder re-renders.
  const openPreview = useCallback(() => setPreviewOpen(true), []);
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const handlePaletteAdd = useCallback(() => setPane("build"), []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100">
      <BuilderTopBar onPreview={openPreview} />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-0 flex-1">
          <aside
            aria-label="Field library"
            className={cn(
              "min-h-0 min-w-0 flex-1 flex-col border-slate-200 bg-white",
              "lg:flex lg:w-66 lg:flex-none lg:border-r",
              pane === "add" ? "flex" : "hidden",
            )}
          >
            <FieldPalette onAdd={handlePaletteAdd} />
          </aside>

          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100",
              "lg:block",
              pane === "build" ? "block" : "hidden",
            )}
          >
            <CanvasDropArea
              insertIndex={insertIndex}
              draggingFromPalette={active?.source === "palette"}
              hasFields={form.fields.length > 0}
            />
          </div>

          {/* InspectorPanel brings its own <aside>, border and scrolling. */}
          <InspectorPanel
            className={cn(
              "min-h-0 min-w-0 flex-1 lg:flex lg:w-80 lg:flex-none",
              pane === "style" ? "flex" : "hidden",
            )}
          />
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
          {active ? <DragGhost active={active} /> : null}
        </DragOverlay>
      </DndContext>

      <nav
        aria-label="Builder sections"
        className="flex-none border-t border-slate-200 bg-white px-3 py-2 lg:hidden"
      >
        <SegmentedControl value={pane} onChange={setPane} options={PANE_OPTIONS} />
      </nav>

      <PreviewModal open={previewOpen} onClose={closePreview} />
    </div>
  );
}

function DragGhost({ active }: { active: ActiveDrag }) {
  if (active.source === "palette") {
    const Icon = FIELD_ICONS[active.fieldType];
    return (
      <div className="flex w-max cursor-grabbing items-center gap-2.5 rounded-xl border border-brand-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/15 ring-4 ring-brand-500/10">
        <span className="grid size-7 flex-none place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="size-4" />
        </span>
        <span className="text-[13px] font-medium text-slate-900">
          {FIELD_META[active.fieldType].name}
        </span>
      </div>
    );
  }

  const { field } = active;
  const Icon = FIELD_ICONS[field.type];
  return (
    <div className="flex w-72 max-w-[80vw] cursor-grabbing items-center gap-2.5 rounded-xl border border-brand-200 bg-white px-3 py-2.5 shadow-xl shadow-slate-900/15 ring-4 ring-brand-500/10">
      <span className="grid size-8 flex-none place-items-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-slate-900">
          {field.label || FIELD_META[field.type].name}
        </span>
        <span className="block text-[11.5px] text-slate-500">
          {FIELD_META[field.type].name}
        </span>
      </span>
    </div>
  );
}
