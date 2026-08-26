"use client";

import { useEffect, useRef, useState } from "react";
import { COLOR_SWATCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function normalizeHex(value: string): string | null {
  const v = value.trim().replace(/^#?/, "#");
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v.toLowerCase() : null;
}

export function ColorInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  /** Non-null only while the author is mid-edit; otherwise the prop wins. */
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const shown = draft ?? value;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const commit = (raw: string) => {
    setDraft(raw);
    const hex = normalizeHex(raw);
    if (hex) onChange(hex);
  };

  const pick = (hex: string) => {
    setDraft(null);
    onChange(hex);
  };

  return (
    <div className={cn("relative", className)} ref={ref}>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-left text-sm shadow-xs transition-colors hover:border-slate-400"
      >
        <span
          className="size-5 flex-none rounded-md ring-1 ring-inset ring-black/10"
          style={{ background: value }}
        />
        <span className="font-mono text-[12.5px] uppercase text-slate-600">
          {value}
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-60 animate-pop rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10">
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                title={swatch}
                onClick={() => pick(swatch)}
                className={cn(
                  "size-6 cursor-pointer rounded-md ring-1 ring-inset ring-black/10 transition-transform hover:scale-110",
                  value.toLowerCase() === swatch.toLowerCase() &&
                    "ring-2 ring-brand-500 ring-offset-1",
                )}
                style={{ background: swatch }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={normalizeHex(shown) ?? "#000000"}
              onChange={(e) => commit(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
              aria-label={`${label} colour picker`}
            />
            <input
              value={shown}
              onChange={(e) => commit(e.target.value)}
              onBlur={() => setDraft(null)}
              spellCheck={false}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-[12.5px] uppercase focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              aria-label={`${label} hex value`}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
