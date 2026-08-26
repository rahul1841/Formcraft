"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const BASE =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-all placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const OK_RING = "border-slate-300 focus:border-brand-500 focus:ring-brand-500/15";
const ERR_RING = "border-red-400 focus:border-red-500 focus:ring-red-500/15";

export interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FieldShell({
  label,
  hint,
  error,
  required,
  className,
  htmlFor,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-[13px] font-medium text-slate-700"
        >
          {label}
          {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[12.5px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  icon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, className, wrapperClassName, required, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
      htmlFor={inputId}
    >
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(BASE, error ? ERR_RING : OK_RING, icon && "pl-9.5", className)}
          {...props}
        />
      </div>
    </FieldShell>
  );
});

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, className, wrapperClassName, required, id, ...props },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FieldShell
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={wrapperClassName}
        htmlFor={inputId}
      >
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(BASE, "min-h-20 resize-y leading-relaxed", error ? ERR_RING : OK_RING, className)}
          {...props}
        />
      </FieldShell>
    );
  },
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  options: { value: string; label: string; disabled?: boolean }[];
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, className, wrapperClassName, required, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
      htmlFor={inputId}
    >
      <select
        ref={ref}
        id={inputId}
        className={cn(BASE, "cursor-pointer pr-8", error ? ERR_RING : OK_RING, className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});
