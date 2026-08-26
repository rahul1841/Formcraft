"use client";

import { Star } from "lucide-react";
import { isAnswerable } from "@/lib/constants";
import type { AnswerValue, FormField } from "@/lib/types";

export interface FieldRendererProps {
  field: FormField;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onBlur?: () => void;
  error?: string | null;
  /** 1-based question number, or null to hide numbering. */
  questionNumber?: number | null;
  disabled?: boolean;
  idPrefix?: string;
}

/**
 * Renders one field of a form. Purely presentational + controlled: all styling
 * comes from the `.ncf-*` classes, which read the theme CSS variables set by
 * <FormRenderer>. Used by the live form AND by the builder canvas preview.
 */
export function FieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  error,
  questionNumber,
  disabled,
  idPrefix = "f",
}: FieldRendererProps) {
  const inputId = `${idPrefix}-${field.id}`;
  const helpId = field.helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  /* ------------------------------ static blocks ----------------------------- */

  if (field.type === "divider") {
    return <hr className="ncf-divider" />;
  }

  if (field.type === "heading") {
    const level = field.headingLevel ?? 2;
    const Tag = (`h${level}` as "h1" | "h2" | "h3");
    return (
      <Tag className="ncf-heading" data-level={level}>
        {field.content || field.label}
      </Tag>
    );
  }

  if (field.type === "paragraph") {
    return <p className="ncf-paragraph">{field.content || field.label}</p>;
  }

  /* -------------------------------- controls -------------------------------- */

  const common = {
    id: inputId,
    name: field.id,
    disabled,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    className: "ncf-control",
    onBlur,
  };

  let control: React.ReactNode = null;

  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          {...common}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          maxLength={field.validation?.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;

    case "select":
      control = (
        <select
          {...common}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder || "Select an option"}</option>
          {(field.options ?? []).map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;

    case "radio": {
      const current = (value as string) ?? "";
      control = (
        <div
          className="ncf-options"
          data-layout={field.optionLayout ?? "vertical"}
          role="radiogroup"
          aria-labelledby={`${inputId}-label`}
          aria-describedby={describedBy}
        >
          {(field.options ?? []).map((option) => {
            const checked = current === option.value;
            return (
              <label
                key={option.id}
                className="ncf-option"
                data-checked={checked}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(option.value)}
                  onBlur={onBlur}
                  className="sr-only"
                />
                <span className="ncf-tick" data-shape="circle" data-checked={checked}>
                  {checked ? <span /> : null}
                </span>
                <span className="ncf-option-text">{option.label}</span>
              </label>
            );
          })}
        </div>
      );
      break;
    }

    case "checkboxGroup":
    case "multiselect": {
      const current = Array.isArray(value) ? (value as string[]) : [];
      const layout =
        field.optionLayout ?? (field.type === "multiselect" ? "horizontal" : "vertical");
      control = (
        <div
          className="ncf-options"
          data-layout={layout}
          role="group"
          aria-labelledby={`${inputId}-label`}
          aria-describedby={describedBy}
        >
          {(field.options ?? []).map((option) => {
            const checked = current.includes(option.value);
            return (
              <label
                key={option.id}
                className="ncf-option"
                data-checked={checked}
              >
                <input
                  type="checkbox"
                  name={field.id}
                  value={option.value}
                  checked={checked}
                  disabled={disabled}
                  onChange={() =>
                    onChange(
                      checked
                        ? current.filter((v) => v !== option.value)
                        : [...current, option.value],
                    )
                  }
                  onBlur={onBlur}
                  className="sr-only"
                />
                <span className="ncf-tick" data-shape="square" data-checked={checked}>
                  {checked ? (
                    <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="ncf-option-text">{option.label}</span>
              </label>
            );
          })}
        </div>
      );
      break;
    }

    case "checkbox": {
      const checked = value === true;
      control = (
        <label className="ncf-consent">
          <input
            type="checkbox"
            id={inputId}
            name={field.id}
            checked={checked}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            className="sr-only"
          />
          <span
            className="ncf-tick"
            data-shape="square"
            data-checked={checked}
            style={{ marginTop: 2 }}
          >
            {checked ? (
              <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
                <path
                  d="M3.5 8.5l3 3 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          <span className="ncf-option-text">
            {field.checkboxLabel || field.label}
          </span>
        </label>
      );
      break;
    }

    case "rating": {
      const max = field.maxRating ?? 5;
      const current = typeof value === "number" ? value : 0;
      control = (
        <div
          className="ncf-stars"
          role="radiogroup"
          aria-labelledby={`${inputId}-label`}
          aria-describedby={describedBy}
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={current === score}
              aria-label={`${score} of ${max}`}
              disabled={disabled}
              className="ncf-star"
              data-active={score <= current}
              onClick={() => onChange(current === score ? null : score)}
            >
              <Star
                className="size-7"
                fill={score <= current ? "currentColor" : "none"}
                strokeWidth={1.6}
              />
            </button>
          ))}
        </div>
      );
      break;
    }

    case "range": {
      const min = field.validation?.min ?? 0;
      const max = field.validation?.max ?? 100;
      const current =
        typeof value === "number" ? value : Number(field.defaultValue ?? min);
      control = (
        <div className="ncf-range-row">
          <input
            type="range"
            id={inputId}
            name={field.id}
            className="ncf-range"
            min={min}
            max={max}
            step={field.step ?? 1}
            value={Number.isFinite(current) ? current : min}
            disabled={disabled}
            aria-describedby={describedBy}
            onChange={(e) => onChange(Number(e.target.value))}
            onBlur={onBlur}
          />
          <span className="ncf-range-value">
            {Number.isFinite(current) ? current : min}
          </span>
        </div>
      );
      break;
    }

    case "number":
      control = (
        <input
          {...common}
          type="number"
          inputMode="decimal"
          placeholder={field.placeholder}
          min={field.validation?.min}
          max={field.validation?.max}
          value={value === null || value === undefined ? "" : String(value)}
          // Keep the raw string: Number() would eat a trailing "." or "-" mid-typing.
          // coerceAnswer() converts it when the answer is validated or submitted.
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        />
      );
      break;

    case "date":
    case "time":
      control = (
        <input
          {...common}
          type={field.type}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;

    case "email":
    case "phone":
    case "url":
    case "text":
    default:
      control = (
        <input
          {...common}
          type={
            field.type === "email"
              ? "email"
              : field.type === "phone"
                ? "tel"
                : field.type === "url"
                  ? "url"
                  : "text"
          }
          placeholder={field.placeholder}
          maxLength={field.validation?.maxLength}
          autoComplete={
            field.type === "email"
              ? "email"
              : field.type === "phone"
                ? "tel"
                : undefined
          }
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
  }

  // Radio / checkbox / rating groups get a plain <span> label plus aria-labelledby;
  // a native <select> is a single labellable control and needs a real <label for>.
  const usesFieldsetLabel =
    field.type === "radio" ||
    field.type === "checkboxGroup" ||
    field.type === "multiselect" ||
    field.type === "rating";
  const showTopLabel = field.type !== "checkbox";

  return (
    <div className="ncf-field" data-align={field.align} data-type={field.type}>
      {showTopLabel ? (
        usesFieldsetLabel ? (
          <span className="ncf-label" id={`${inputId}-label`}>
            {questionNumber ? (
              <span className="ncf-number-badge">{questionNumber}.</span>
            ) : null}
            {field.label}
            {field.required ? (
              <span className="ncf-required" aria-hidden>
                *
              </span>
            ) : null}
          </span>
        ) : (
          <label className="ncf-label" htmlFor={inputId} id={`${inputId}-label`}>
            {questionNumber ? (
              <span className="ncf-number-badge">{questionNumber}.</span>
            ) : null}
            {field.label}
            {field.required ? (
              <span className="ncf-required" aria-hidden>
                *
              </span>
            ) : null}
          </label>
        )
      ) : (
        <span className="ncf-label" id={`${inputId}-label`}>
          {questionNumber ? (
            <span className="ncf-number-badge">{questionNumber}.</span>
          ) : null}
          {field.label}
          {field.required ? (
            <span className="ncf-required" aria-hidden>
              *
            </span>
          ) : null}
        </span>
      )}

      {control}

      {field.helpText ? (
        <span className="ncf-help" id={helpId}>
          {field.helpText}
        </span>
      ) : null}

      {error ? (
        <span className="ncf-error" id={errorId} role="alert">
          <svg viewBox="0 0 16 16" className="size-3.5 flex-none" aria-hidden>
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4.2M8 11.2h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Does this field type accept an answer? Re-exported for convenience. */
export { isAnswerable };
