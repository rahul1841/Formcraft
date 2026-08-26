"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Code, Copy, ExternalLink, TriangleAlert } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { FieldShell } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { absoluteUrl, cn } from "@/lib/utils";
import type { FormSummary } from "@/lib/types";

type CopyTarget = "url" | "embed";

/** Open whenever `form` is non-null; unmounting on close resets the copy state. */
export function ShareModal({
  form,
  onClose,
}: {
  form: FormSummary | null;
  onClose: () => void;
}) {
  if (!form) return null;
  return <ShareDialog form={form} onClose={onClose} />;
}

function ShareDialog({
  form,
  onClose,
}: {
  form: FormSummary;
  onClose: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [embedOpen, setEmbedOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const url = absoluteUrl(`/f/${form.slug}`);
  const embedCode = `<iframe src="${url}" width="100%" height="800" style="border:0"></iframe>`;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (target: CopyTarget, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(target);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(null), 2000);
      } catch {
        toast.error("Copy failed", "Select the text and copy it manually.");
      }
    },
    [toast],
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Share form"
      description={form.title}
      footer={
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        {form.status !== "published" ? (
          <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-800">
            <TriangleAlert className="mt-0.5 size-4 flex-none" aria-hidden />
            <p>
              This form is{" "}
              <strong className="font-semibold">
                {form.status === "closed" ? "closed" : "still a draft"}
              </strong>
              . The link below only accepts responses once you publish it from the
              builder.
            </p>
          </div>
        ) : null}

        <FieldShell label="Public link" htmlFor="share-public-url">
          <div className="flex items-center gap-2">
            <input
              id="share-public-url"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-[12.5px] text-slate-700 shadow-xs transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
            />
            <Button
              variant={copied === "url" ? "subtle" : "outline"}
              className="flex-none"
              onClick={() => copy("url", url)}
              icon={
                copied === "url" ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )
              }
            >
              {copied === "url" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </FieldShell>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("secondary", "md", "w-full")}
        >
          <ExternalLink className="size-4" aria-hidden />
          Open form
        </a>

        <div className="rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setEmbedOpen((v) => !v)}
            aria-expanded={embedOpen}
            aria-controls="share-embed-panel"
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-brand-500/25 focus-visible:outline-none"
          >
            <Code className="size-4 text-slate-400" aria-hidden />
            Embed on your website
            <ChevronDown
              className={cn(
                "ml-auto size-4 text-slate-400 transition-transform duration-150",
                embedOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {embedOpen ? (
            <div
              id="share-embed-panel"
              className="space-y-2.5 border-t border-slate-100 p-3"
            >
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[12px] leading-relaxed text-slate-100">
                <code>{embedCode}</code>
              </pre>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12.5px] text-slate-500">
                  Paste this snippet wherever the form should appear.
                </p>
                <Button
                  variant={copied === "embed" ? "subtle" : "outline"}
                  size="sm"
                  className="flex-none"
                  onClick={() => copy("embed", embedCode)}
                  icon={
                    copied === "embed" ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )
                  }
                >
                  {copied === "embed" ? "Copied!" : "Copy code"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
