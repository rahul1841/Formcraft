"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CopyPlus,
  EllipsisVertical,
  ExternalLink,
  Inbox,
  Layers,
  Share2,
  SquarePen,
  Trash2,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api-client";
import { absoluteUrl, pluralize, relativeTime } from "@/lib/utils";
import type { Form, FormSummary } from "@/lib/types";

export function FormCard({
  form,
  onShare,
  onChanged,
}: {
  form: FormSummary;
  onShare: (form: FormSummary) => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<null | "duplicate">(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const editHref = `/admin/forms/${form.id}/edit`;
  const responsesHref = `/admin/forms/${form.id}/responses`;

  const duplicate = async () => {
    setBusy("duplicate");
    try {
      const { form: copy } = await api.post<{ form: Form }>(
        `/api/forms/${form.id}/duplicate`,
      );
      toast.success("Form duplicated", `“${copy.title}” is ready to edit.`);
      onChanged();
    } catch (err) {
      toast.error(
        "Could not duplicate the form",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    try {
      await api.del(`/api/forms/${form.id}`);
      toast.success("Form deleted", `“${form.title}” and its responses are gone.`);
      onChanged();
    } catch (err) {
      toast.error(
        "Could not delete the form",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const items: DropdownItem[] = [
    {
      label: "Edit",
      icon: <SquarePen className="size-4" aria-hidden />,
      onSelect: () => router.push(editHref),
    },
    {
      label: "View responses",
      icon: <Inbox className="size-4" aria-hidden />,
      onSelect: () => router.push(responsesHref),
    },
    ...(form.status === "published"
      ? [
          {
            label: "Open live form",
            icon: <ExternalLink className="size-4" aria-hidden />,
            onSelect: () =>
              window.open(
                absoluteUrl(`/f/${form.slug}`),
                "_blank",
                "noopener,noreferrer",
              ),
          } satisfies DropdownItem,
        ]
      : []),
    {
      label: "Share",
      icon: <Share2 className="size-4" aria-hidden />,
      onSelect: () => onShare(form),
    },
    {
      label: "Duplicate",
      icon: <CopyPlus className="size-4" aria-hidden />,
      onSelect: duplicate,
      disabled: busy !== null,
      separatorBefore: true,
    },
    {
      label: "Delete",
      icon: <Trash2 className="size-4" aria-hidden />,
      tone: "danger",
      onSelect: () => setConfirmOpen(true),
      separatorBefore: true,
    },
  ];

  return (
    <>
      {/* No `overflow-hidden` here: it would clip the actions menu, which paints
          outside the card. Children that touch a corner round themselves instead. */}
      <Card className="group relative flex flex-col transition-all duration-150 hover:border-slate-300 hover:shadow-sm">
        <div
          className="h-0.5 w-full flex-none rounded-t-2xl"
          style={{ backgroundColor: form.theme.primaryColor }}
          aria-hidden
        />

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">
                <Link
                  href={editHref}
                  className="line-clamp-1 rounded-sm outline-none hover:text-brand-700 focus-visible:ring-4 focus-visible:ring-brand-500/25"
                  title={form.title}
                >
                  {form.title}
                </Link>
              </h3>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">
                {form.description || "No description yet."}
              </p>
            </div>
            <span className="flex-none">
              <StatusBadge status={form.status} />
            </span>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5 text-slate-400" aria-hidden />
              {pluralize(form.fieldCount, "field")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Inbox className="size-3.5 text-slate-400" aria-hidden />
              {pluralize(form.responseCount, "response")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-slate-300" aria-hidden />
              Edited {relativeTime(form.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-1">
            <ButtonLink
              href={editHref}
              variant="outline"
              size="sm"
              icon={<SquarePen className="size-3.5" aria-hidden />}
            >
              Edit
            </ButtonLink>
            <ButtonLink
              href={responsesHref}
              variant="ghost"
              size="sm"
              icon={<Inbox className="size-3.5" aria-hidden />}
            >
              Responses
            </ButtonLink>
          </div>

          <Dropdown
            align="right"
            className="flex-none"
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-haspopup="menu"
                aria-label={`More actions for ${form.title}`}
              >
                <EllipsisVertical className="size-4" aria-hidden />
              </Button>
            }
            items={items}
          />
        </div>

        {busy ? (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/70">
            <Spinner className="size-5" />
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        title="Delete this form?"
        confirmLabel="Delete form"
        description={
          <>
            <strong className="font-medium text-slate-900">“{form.title}”</strong>
            {form.responseCount > 0 ? (
              <> and all {pluralize(form.responseCount, "response")} collected by it</>
            ) : null}{" "}
            will be permanently deleted. This cannot be undone.
          </>
        }
      />
    </>
  );
}
