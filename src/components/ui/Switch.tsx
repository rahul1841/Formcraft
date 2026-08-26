"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      {label ? (
        <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
          <span className="block text-[13px] font-medium text-slate-700">
            {label}
          </span>
          {description ? (
            <span className="mt-0.5 block text-[12.5px] text-slate-500">
              {description}
            </span>
          ) : null}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === "string" ? label : "Toggle"}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5.5 w-10 flex-none cursor-pointer items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25",
          checked ? "bg-brand-600" : "bg-slate-300",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block size-4.5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
