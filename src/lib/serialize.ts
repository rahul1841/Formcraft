import type { FormDoc } from "@/models/Form";
import type { SubmissionDoc } from "@/models/Submission";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/lib/constants";
import type {
  AnswerValue,
  Form,
  FormField,
  FormSummary,
  PublicForm,
  Submission,
} from "@/lib/types";

type Lean = Record<string, unknown>;

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function serializeForm(doc: FormDoc | Lean): Form {
  const d = doc as unknown as FormDoc;
  return {
    id: String(d._id),
    title: d.title ?? "Untitled form",
    description: d.description ?? "",
    slug: d.slug,
    status: (d.status ?? "draft") as Form["status"],
    fields: plain((d.fields ?? []) as unknown as FormField[]),
    theme: { ...DEFAULT_THEME, ...plain(d.theme ?? {}) },
    settings: { ...DEFAULT_SETTINGS, ...plain(d.settings ?? {}) },
    responseCount: d.responseCount ?? 0,
    createdAt: new Date(d.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(d.updatedAt ?? Date.now()).toISOString(),
    publishedAt: d.publishedAt ? new Date(d.publishedAt).toISOString() : null,
  };
}

export function serializeFormSummary(doc: FormDoc | Lean): FormSummary {
  const form = serializeForm(doc);
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    slug: form.slug,
    status: form.status,
    fieldCount: form.fields.filter(
      (f) => !["heading", "paragraph", "divider"].includes(f.type),
    ).length,
    responseCount: form.responseCount,
    theme: {
      primaryColor: form.theme.primaryColor,
      backgroundColor: form.theme.backgroundColor,
    },
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

export function serializePublicForm(doc: FormDoc | Lean): PublicForm {
  const form = serializeForm(doc);
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    slug: form.slug,
    status: form.status,
    fields: form.fields,
    theme: form.theme,
    settings: {
      submitButtonText: form.settings.submitButtonText,
      successMessage: form.settings.successMessage,
      redirectUrl: form.settings.redirectUrl,
      showProgressBar: form.settings.showProgressBar,
    },
  };
}

export function serializeSubmission(doc: SubmissionDoc | Lean): Submission {
  const d = doc as unknown as SubmissionDoc;
  return {
    id: String(d._id),
    formId: String(d.formId),
    data: plain((d.data ?? {}) as Record<string, AnswerValue>),
    fieldSnapshot: plain(d.fieldSnapshot ?? []) as Submission["fieldSnapshot"],
    submittedAt: new Date(d.submittedAt ?? Date.now()).toISOString(),
    meta: {
      userAgent: d.meta?.userAgent ?? undefined,
      ip: d.meta?.ip ?? undefined,
      durationMs: d.meta?.durationMs ?? undefined,
    },
  };
}
