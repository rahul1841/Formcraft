"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import { FieldRenderer } from "@/components/form/FieldRenderer";
import { isAnswerable } from "@/lib/constants";
import { backgroundStyle, themeToCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { isEmptyAnswer, validateAnswer, validateAnswers } from "@/lib/validation";
import type { AnswerValue, FormField, PublicForm } from "@/lib/types";

const WIDTH_CLASS: Record<string, string> = {
  full: "ncf-col-full",
  half: "ncf-col-half",
  third: "ncf-col-third",
};

export interface SubmitPayload {
  data: Record<string, AnswerValue>;
  durationMs: number;
}

export interface FormRendererProps {
  form: PublicForm;
  /** "preview" keeps every control interactive but never sends anything. */
  mode?: "live" | "preview";
  onSubmit?: (payload: SubmitPayload) => Promise<void>;
  /** Renders only the card (no page background) — used inside the builder. */
  embedded?: boolean;
  className?: string;
}

/**
 * The redirect URL is author-supplied and gets assigned to window.location, so a
 * `javascript:` or `data:` URL would run as script on this origin. Only ever
 * follow an absolute http(s) destination.
 */
function safeRedirect(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function defaultValues(fields: FormField[]): Record<string, AnswerValue> {
  const values: Record<string, AnswerValue> = {};
  for (const field of fields) {
    if (!isAnswerable(field.type)) continue;
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      values[field.id] = field.defaultValue as AnswerValue;
    } else if (field.type === "multiselect" || field.type === "checkboxGroup") {
      values[field.id] = [];
    } else if (field.type === "checkbox") {
      values[field.id] = false;
    } else if (field.type === "range") {
      values[field.id] = field.validation?.min ?? 0;
    } else if (field.type === "rating" || field.type === "number") {
      values[field.id] = null;
    } else {
      values[field.id] = "";
    }
  }
  return values;
}

export function FormRenderer({
  form,
  mode = "live",
  onSubmit,
  embedded = false,
  className,
}: FormRendererProps) {
  const { theme, settings, fields } = form;
  const redirectTo = safeRedirect(settings.redirectUrl);

  /**
   * Only what the respondent actually typed lives in state; defaults are derived
   * on every render. That way the builder can add, remove or re-default fields
   * without ever clobbering an answer that is already on screen.
   */
  const [entered, setEntered] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const values = useMemo(() => {
    const merged = defaultValues(fields);
    for (const [id, value] of Object.entries(entered)) {
      if (id in merged) merged[id] = value;
    }
    return merged;
  }, [fields, entered]);

  const answerable = useMemo(() => fields.filter((f) => isAnswerable(f.type)), [fields]);
  const requiredFields = useMemo(
    () => answerable.filter((f) => f.required),
    [answerable],
  );

  const progressTarget = requiredFields.length || answerable.length;
  const progressDone = (requiredFields.length ? requiredFields : answerable).filter(
    (f) => !isEmptyAnswer(values[f.id]),
  ).length;
  const progress = progressTarget ? Math.round((progressDone / progressTarget) * 100) : 0;

  const setValue = (field: FormField, value: AnswerValue) => {
    setEntered((prev) => ({ ...prev, [field.id]: value }));
    if (touched[field.id] || errors[field.id]) {
      const message = validateAnswer(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (message) next[field.id] = message;
        else delete next[field.id];
        return next;
      });
    }
  };

  const handleBlur = (field: FormField) => {
    setTouched((prev) => ({ ...prev, [field.id]: true }));
    const message = validateAnswer(field, values[field.id]);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field.id] = message;
      else delete next[field.id];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const { errors: found, cleaned } = validateAnswers(fields, values);
    if (Object.keys(found).length) {
      setErrors(found);
      setTouched(Object.fromEntries(answerable.map((f) => [f.id, true])));
      setFormError("Please fix the highlighted answers and try again.");
      const firstId = Object.keys(found)[0];
      formRef.current
        ?.querySelector<HTMLElement>(`[data-field-wrapper="${firstId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (mode === "preview" || !onSubmit) {
      setStatus("success");
      return;
    }

    setStatus("submitting");
    try {
      await onSubmit({
        data: cleaned,
        durationMs: startedAt.current ? Date.now() - startedAt.current : 0,
      });
      setStatus("success");
      if (redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 900);
      }
    } catch (err) {
      setStatus("idle");
      const maybe = err as { message?: string; fieldErrors?: Record<string, string> };
      if (maybe?.fieldErrors && Object.keys(maybe.fieldErrors).length) {
        setErrors(maybe.fieldErrors);
      }
      setFormError(maybe?.message ?? "We couldn't submit your response. Please retry.");
    }
  };

  const resetForm = () => {
    setEntered({});
    setErrors({});
    setTouched({});
    setStatus("idle");
    setFormError(null);
    startedAt.current = Date.now();
  };

  const rootStyle = themeToCssVars(theme);

  // Question numbers are positional, so precompute them instead of counting mid-render.
  const questionNumbers = useMemo(() => {
    const numbers = new Map<string, number>();
    let n = 0;
    for (const field of fields) {
      if (isAnswerable(field.type)) numbers.set(field.id, ++n);
    }
    return numbers;
  }, [fields]);

  const card = (
    <div className="ncf-card">
      {theme.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ncf-cover" src={theme.coverImageUrl} alt="" />
      ) : null}

      {status === "success" ? (
        <div className="ncf-success">
          <div className="ncf-success-icon">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <h2 className="ncf-title">Thank you</h2>
          <p className="ncf-description" style={{ marginTop: 10 }}>
            {settings.successMessage}
          </p>
          {mode === "preview" ? (
            <button type="button" className="ncf-submit" style={{ marginTop: 24 }} onClick={resetForm}>
              Reset preview
            </button>
          ) : redirectTo ? (
            <p className="ncf-footer-note">Redirecting you now…</p>
          ) : (
            <button
              type="button"
              className="ncf-submit"
              style={{ marginTop: 24 }}
              onClick={resetForm}
            >
              Submit another response
            </button>
          )}
        </div>
      ) : (
        <div className="ncf-card-body">
          <div className="ncf-header">
            <h1 className="ncf-title">{form.title}</h1>
            {form.description ? (
              <p className="ncf-description">{form.description}</p>
            ) : null}
          </div>

          {settings.showProgressBar && progressTarget > 0 ? (
            <>
              <div className="ncf-progress">
                <div className="ncf-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="ncf-progress-label">
                <span>
                  {progressDone} of {progressTarget} answered
                </span>
                <span>{progress}%</span>
              </div>
            </>
          ) : null}

          {formError ? (
            <div className="ncf-alert" role="alert">
              <CircleAlert className="size-4.5 flex-none" style={{ marginTop: 1 }} />
              <span>{formError}</span>
            </div>
          ) : null}

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="ncf-grid">
              {fields.map((field) => {
                const number = theme.showQuestionNumbers
                  ? (questionNumbers.get(field.id) ?? null)
                  : null;
                return (
                  <div
                    key={field.id}
                    className={WIDTH_CLASS[field.width] ?? "ncf-col-full"}
                    data-field-wrapper={field.id}
                  >
                    <FieldRenderer
                      field={field}
                      value={values[field.id] ?? null}
                      onChange={(value) => setValue(field, value)}
                      onBlur={() => handleBlur(field)}
                      error={errors[field.id]}
                      questionNumber={number}
                    />
                  </div>
                );
              })}
            </div>

            {answerable.length === 0 && fields.length === 0 ? (
              <p className="ncf-paragraph" style={{ padding: "24px 0" }}>
                This form doesn&apos;t have any questions yet.
              </p>
            ) : null}

            <div className="ncf-actions" data-align={theme.buttonAlign}>
              <button
                type="submit"
                className="ncf-submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  settings.submitButtonText || "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className={cn("ncf-root", className)} style={rootStyle} data-input-style={theme.inputStyle} data-button-style={theme.buttonStyle}>
        {card}
      </div>
    );
  }

  return (
    <div
      className={cn("ncf-root min-h-full w-full px-4 py-10 sm:px-6 sm:py-14", className)}
      style={{ ...rootStyle, ...backgroundStyle(theme) }}
      data-input-style={theme.inputStyle}
      data-button-style={theme.buttonStyle}
    >
      {card}
      <p className="ncf-footer-note">
        Built with <strong>Formcraft</strong>
      </p>
    </div>
  );
}
