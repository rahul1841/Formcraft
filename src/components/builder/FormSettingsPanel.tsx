"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { DEFAULT_SETTINGS, LIMITS } from "@/lib/constants";
import { absoluteUrl, cn } from "@/lib/utils";
import { useBuilder } from "@/components/builder/builder-context";
import {
  Labeled,
  NumberField,
  Section,
} from "@/components/builder/FieldSettingsPanel";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Textarea } from "@/components/ui/Input";
import {
  SegmentedControl,
  type SegmentOption,
} from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import type { FormStatus } from "@/lib/types";

const FALLBACK_TITLE = "Untitled form";

const STATUS_OPTIONS: SegmentOption<FormStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Live" },
  { value: "closed", label: "Closed" },
];

/** No external store to watch: the link only needs the client-side snapshot. */
const subscribeNever = () => () => {};

const STATUS_HELP: Record<FormStatus, string> = {
  draft: "Only you can see it — the public link shows a “not available” page.",
  published: "Anyone with the link can open the form and send a response.",
  closed: "The link still works but shows your closed message instead.",
};

export function FormSettingsPanel() {
  const { form, updateForm, updateSettings, setStatus } = useBuilder();
  const router = useRouter();
  const toast = useToast();
  const settings = form.settings;

  const [copied, setCopied] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // absoluteUrl() can fall back to window.location, so the link is read from
  // the browser after hydration — the server renders an empty box instead of
  // guessing an origin it may not know.
  const link = useSyncExternalStore(
    subscribeNever,
    () => absoluteUrl(`/f/${form.slug}`),
    () => "",
  );

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy the link", "Select it and copy manually.");
    }
  };

  const changeStatus = async (next: FormStatus) => {
    if (next === form.status || statusPending) return;
    setStatusPending(true);
    try {
      await setStatus(next);
      toast.success(
        next === "published"
          ? "Your form is live"
          : next === "closed"
            ? "Form closed to new responses"
            : "Form moved back to draft",
      );
    } catch {
      /* the builder already surfaces save failures */
    } finally {
      setStatusPending(false);
    }
  };

  const deleteForm = async () => {
    try {
      await api.del(`/api/forms/${form.id}`);
      toast.success("Form deleted");
      router.push("/admin");
    } catch (err) {
      toast.error(
        "Couldn't delete this form",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <div className="divide-y divide-slate-100 pb-10">
      {/* -------------------------------- basics ------------------------------ */}
      <Section title="Basics">
        <Input
          label="Form title"
          value={form.title}
          maxLength={LIMITS.titleMax}
          placeholder={FALLBACK_TITLE}
          onChange={(e) => updateForm({ title: e.target.value })}
          onBlur={(e) => {
            if (!e.target.value.trim()) updateForm({ title: FALLBACK_TITLE });
          }}
        />
        <Textarea
          label="Description"
          rows={3}
          maxLength={LIMITS.descriptionMax}
          value={form.description}
          placeholder="One or two lines shown under the title."
          onChange={(e) => updateForm({ description: e.target.value })}
        />
      </Section>

      {/* -------------------------------- status ------------------------------ */}
      <Section title="Status">
        <Labeled label="Who can respond" hint={STATUS_HELP[form.status]}>
          <div aria-busy={statusPending} className={cn(statusPending && "opacity-60")}>
            <SegmentedControl
              value={form.status}
              options={STATUS_OPTIONS}
              onChange={(v) => void changeStatus(v)}
            />
          </div>
        </Labeled>
      </Section>

      {/* --------------------------------- link ------------------------------- */}
      <Section title="Public link">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            aria-label="Public form link"
            onFocus={(e) => e.currentTarget.select()}
            className="h-9 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-2.5 font-mono text-[12px] text-slate-600 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void copyLink()}
            disabled={!link}
            title="Copy link"
            aria-label="Copy public link"
            icon={
              copied ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )
            }
          />
        </div>
        <p className="text-[12.5px] text-slate-500">
          {copied
            ? "Copied to your clipboard."
            : form.status === "published"
              ? "Share this anywhere — no account needed to answer."
              : "Set the form to Live before you share this link."}
        </p>
      </Section>

      {/* ----------------------------- after submit --------------------------- */}
      <Section title="After submit">
        <Input
          label="Submit button text"
          value={settings.submitButtonText}
          maxLength={60}
          placeholder={DEFAULT_SETTINGS.submitButtonText}
          onChange={(e) => updateSettings({ submitButtonText: e.target.value })}
          onBlur={(e) => {
            if (!e.target.value.trim())
              updateSettings({
                submitButtonText: DEFAULT_SETTINGS.submitButtonText,
              });
          }}
        />
        <Textarea
          label="Success message"
          rows={3}
          maxLength={2000}
          value={settings.successMessage}
          placeholder="Thanks! Your response has been recorded."
          onChange={(e) => updateSettings({ successMessage: e.target.value })}
        />
        <Input
          label="Redirect URL"
          type="url"
          inputMode="url"
          spellCheck={false}
          value={settings.redirectUrl ?? ""}
          maxLength={2000}
          placeholder="https://example.com/thank-you"
          hint="Leave empty to show the success message instead."
          onChange={(e) => updateSettings({ redirectUrl: e.target.value })}
        />
      </Section>

      {/* ------------------------------ responses ----------------------------- */}
      <Section title="Responses">
        <Switch
          label="Show progress bar"
          description="A thin bar tracking how much of the form is filled in."
          checked={settings.showProgressBar}
          onChange={(v) => updateSettings({ showProgressBar: v })}
        />
        <Switch
          label="Allow multiple submissions"
          description="Let the same person answer more than once."
          checked={settings.allowMultipleSubmissions}
          onChange={(v) => updateSettings({ allowMultipleSubmissions: v })}
        />
        <NumberField
          label="Response limit"
          value={settings.responseLimit}
          min={0}
          max={1000000}
          integer
          placeholder="0"
          hint="Stop accepting responses after this many. 0 means unlimited."
          onChange={(v) => updateSettings({ responseLimit: v ?? 0 })}
        />
        <Textarea
          label="Closed message"
          rows={3}
          maxLength={2000}
          value={settings.closedMessage}
          placeholder="This form is no longer accepting responses."
          hint="Shown when the form is closed or the limit is reached."
          onChange={(e) => updateSettings({ closedMessage: e.target.value })}
        />
      </Section>

      {/* ----------------------------- danger zone ---------------------------- */}
      <Section title="Danger zone">
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
          <h4 className="text-[13px] font-semibold text-red-900">
            Delete this form
          </h4>
          <p className="mt-1 text-[12.5px] leading-relaxed text-red-800/80">
            The form, its {form.responseCount === 1 ? "response" : "responses"}{" "}
            ({form.responseCount}) and its public link are removed for good.
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-3 w-full"
            icon={<Trash2 className="size-4" />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete form
          </Button>
        </div>
      </Section>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteForm}
        title={`Delete “${form.title || "Untitled form"}”?`}
        description={`This permanently deletes the form and all ${form.responseCount} ${
          form.responseCount === 1 ? "response" : "responses"
        } collected so far. This can't be undone.`}
        confirmLabel="Delete form"
      />
    </div>
  );
}
