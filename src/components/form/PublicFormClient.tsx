"use client";

import { FormRenderer, type SubmitPayload } from "@/components/form/FormRenderer";
import { api } from "@/lib/api-client";
import type { PublicForm } from "@/lib/types";

interface SubmitResponse {
  submissionId: string;
  successMessage: string;
  redirectUrl?: string;
}

export interface PublicFormClientProps {
  form: PublicForm;
}

/**
 * Thin live wrapper around FormRenderer: it only knows how to talk to the
 * public submit endpoint. Validation errors, the success screen, the progress
 * bar and the redirect are all handled inside FormRenderer, which reads
 * `.message` / `.fieldErrors` off the ApiError this throws.
 */
export function PublicFormClient({ form }: PublicFormClientProps) {
  const handleSubmit = async ({ data, durationMs }: SubmitPayload) => {
    await api.post<SubmitResponse>(
      `/api/public/forms/${encodeURIComponent(form.slug)}/submit`,
      { data, durationMs },
    );
  };

  return <FormRenderer form={form} mode="live" onSubmit={handleSubmit} />;
}
