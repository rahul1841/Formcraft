"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api-client";
import { LIMITS } from "@/lib/constants";
import { FORM_TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { Form } from "@/lib/types";

const FALLBACK_TITLE = "Untitled form";

/**
 * Mounts the dialog only while it is open so every visit starts from a clean
 * template selection — no state to reset by hand.
 */
export function CreateFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <CreateFormDialog onClose={onClose} />;
}

function CreateFormDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const formElementId = useId();

  const [templateId, setTemplateId] = useState(FORM_TEMPLATES[0]?.id ?? "blank");
  const [title, setTitle] = useState(FORM_TEMPLATES[0]?.title ?? FALLBACK_TITLE);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectTemplate = (id: string) => {
    setTemplateId(id);
    const template = FORM_TEMPLATES.find((t) => t.id === id);
    if (template) setTitle(template.title);
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give your form a title.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const { form } = await api.post<{ form: Form }>("/api/forms", {
        templateId,
        title: trimmed,
      });
      router.push(`/admin/forms/${form.id}/edit`);
    } catch (err) {
      setCreating(false);
      if (err instanceof ApiError && err.fieldErrors?.title) {
        setError(err.fieldErrors.title);
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
      toast.error("Could not create the form");
    }
  };

  return (
    <Modal
      open
      onClose={creating ? () => {} : onClose}
      size="lg"
      title="Create a new form"
      description="Pick a starting point — you can change everything later."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formElementId}
            loading={creating}
            icon={<Sparkles className="size-4" aria-hidden />}
          >
            Create form
          </Button>
        </>
      }
    >
      <form id={formElementId} onSubmit={submit} className="space-y-5">
        <fieldset disabled={creating} className="space-y-2.5">
          <legend className="text-[13px] font-medium text-slate-700">
            Start from a template
          </legend>
          <div
            role="radiogroup"
            aria-label="Form template"
            className="grid gap-2.5 sm:grid-cols-2"
          >
            {FORM_TEMPLATES.map((template) => {
              const selected = template.id === templateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectTemplate(template.id)}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-all",
                    "focus-visible:ring-4 focus-visible:ring-brand-500/25 focus-visible:outline-none",
                    selected
                      ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span
                    aria-hidden
                    className="grid size-9 flex-none place-items-center rounded-lg bg-white text-lg shadow-xs ring-1 ring-slate-200"
                  >
                    {template.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">
                      {template.name}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">
                      {template.description}
                    </span>
                  </span>
                  {selected ? (
                    <span className="grid size-4.5 flex-none place-items-center rounded-full bg-brand-600 text-white">
                      <Check className="size-3" aria-hidden />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Input
          label="Form title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={LIMITS.titleMax}
          placeholder="e.g. Customer feedback"
          autoComplete="off"
          disabled={creating}
          error={error}
          hint="Shown at the top of your form and in your dashboard."
          required
        />
      </form>
    </Modal>
  );
}
