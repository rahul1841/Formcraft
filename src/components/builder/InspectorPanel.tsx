"use client";

import { useState } from "react";
import {
  MousePointerClick,
  Palette,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/components/builder/builder-context";
import { DesignPanel } from "@/components/builder/DesignPanel";
import { FieldSettingsPanel } from "@/components/builder/FieldSettingsPanel";
import { FormSettingsPanel } from "@/components/builder/FormSettingsPanel";
import { Tabs, type TabItem } from "@/components/ui/Tabs";

type InspectorTab = "field" | "design" | "form";

const TABS: TabItem<InspectorTab>[] = [
  {
    id: "field",
    label: "Field",
    icon: <SlidersHorizontal className="size-4" aria-hidden />,
  },
  {
    id: "design",
    label: "Design",
    icon: <Palette className="size-4" aria-hidden />,
  },
  {
    id: "form",
    label: "Form",
    icon: <Settings2 className="size-4" aria-hidden />,
  },
];

export function InspectorPanel({ className }: { className?: string }) {
  const { selectedField } = useBuilder();
  const selectedId = selectedField?.id ?? null;
  const [chosenTab, setChosenTab] = useState<InspectorTab>("field");
  // The field the visible tab was chosen for; picking a different field on the
  // canvas snaps the inspector back to its settings.
  const [chosenFor, setChosenFor] = useState<string | null>(selectedId);

  const tab: InspectorTab =
    selectedId && selectedId !== chosenFor ? "field" : chosenTab;

  const selectTab = (next: InspectorTab) => {
    setChosenTab(next);
    setChosenFor(selectedId);
  };

  return (
    <aside
      aria-label="Form inspector"
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-l border-slate-200 bg-white",
        className,
      )}
    >
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={selectTab}
        className="flex-none px-1.5 pt-1"
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {tab === "field" ? (
          selectedField ? (
            <FieldSettingsPanel />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 py-16 text-center">
              <span className="grid size-11 place-items-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                <MousePointerClick className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-slate-700">
                Select a field on the canvas to edit it
              </p>
              <p className="max-w-52 text-[12.5px] leading-relaxed text-slate-500">
                Its label, options, validation and layout all live here.
              </p>
            </div>
          )
        ) : tab === "design" ? (
          <DesignPanel />
        ) : (
          <FormSettingsPanel />
        )}
      </div>
    </aside>
  );
}
