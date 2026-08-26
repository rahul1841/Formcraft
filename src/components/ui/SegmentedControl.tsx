"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  fullWidth = true,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  size?: "sm" | "md";
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex rounded-lg bg-slate-100 p-0.5",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[7px] font-medium transition-all",
              size === "sm" ? "px-2 py-1 text-[12px]" : "px-2.5 py-1.5 text-[13px]",
              active
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
