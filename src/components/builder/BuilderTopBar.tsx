"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Eye,
  Inbox,
  Link2,
  Loader2,
  Redo2,
  Rocket,
  Share2,
  Undo2,
  X,
} from "lucide-react";
import { useBuilder } from "@/components/builder/builder-context";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";
import { LIMITS } from "@/lib/constants";
import { absoluteUrl, cn, relativeTime } from "@/lib/utils";
import type { FormStatus } from "@/lib/types";

const FALLBACK_TITLE = "Untitled form";

export function BuilderTopBar({ onPreview }: { onPreview: () => void }) {
  const {
    form,
    updateForm,
    setStatus,
    undo,
    redo,
    canUndo,
    canRedo,
    dirty,
    saving,
    lastSavedAt,
  } = useBuilder();
  const toast = useToast();
  const [busy, setBusy] = useState<FormStatus | null>(null);

  const live = form.status === "published";

  const copyLink = async () => {
    const url = absoluteUrl(`/f/${form.slug}`);
    try {
      await navigator.clipboard.writeText(url);
      if (live) {
        toast.success("Link copied", url);
      } else {
        toast.info(
          "Link copied — but the form isn't live yet",
          "Publish it before sharing so respondents can open the link.",
        );
      }
    } catch {
      toast.error("Couldn't copy the link", url);
    }
  };

  const changeStatus = async (next: FormStatus) => {
    setBusy(next);
    try {
      await setStatus(next);
      if (next === "published") {
        toast.success("Your form is live", absoluteUrl(`/f/${form.slug}`));
      } else if (next === "draft") {
        toast.info("Back to draft", "The public link now shows a closed notice.");
      } else {
        toast.info("Form closed", "Existing responses are safe — new ones are blocked.");
      }
    } catch {
      // The builder context already surfaces save failures as a toast.
    } finally {
      setBusy(null);
    }
  };

  const publishedItems: DropdownItem[] = [
    { label: "Copy link", icon: <Link2 className="size-4" />, onSelect: () => void copyLink() },
    {
      label: "Open live form",
      icon: <ExternalLink className="size-4" />,
      onSelect: () => window.open(`/f/${form.slug}`, "_blank", "noopener,noreferrer"),
    },
    {
      label: "Unpublish",
      icon: <Eye className="size-4" />,
      separatorBefore: true,
      onSelect: () => void changeStatus("draft"),
    },
    {
      label: "Close form",
      icon: <X className="size-4" />,
      tone: "danger",
      onSelect: () => void changeStatus("closed"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 flex-none items-center gap-1.5 border-b border-slate-200 bg-white px-2 sm:gap-2 sm:px-4">
      <Link
        href="/admin"
        aria-label="Back to dashboard"
        title="Back to dashboard"
        className="flex size-9 flex-none cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/40"
      >
        <ArrowLeft className="size-4.5" />
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <label className="sr-only" htmlFor="builder-form-title">
          Form title
        </label>
        <input
          id="builder-form-title"
          value={form.title}
          maxLength={LIMITS.titleMax}
          spellCheck={false}
          placeholder={FALLBACK_TITLE}
          onChange={(e) => updateForm({ title: e.target.value })}
          onBlur={(e) => {
            if (!e.target.value.trim()) updateForm({ title: FALLBACK_TITLE });
          }}
          className="w-full min-w-0 max-w-[16rem] truncate rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-200 hover:bg-slate-50 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 sm:max-w-xs"
        />
        <SaveStatus saving={saving} dirty={dirty} lastSavedAt={lastSavedAt} />
      </div>

      <div className="flex flex-none items-center gap-1 sm:gap-1.5">
        <div className="hidden items-center md:flex">
          <IconButton
            label="Undo"
            title="Undo (⌘Z)"
            disabled={!canUndo}
            onClick={undo}
            icon={<Undo2 className="size-4" />}
          />
          <IconButton
            label="Redo"
            title="Redo (⇧⌘Z)"
            disabled={!canRedo}
            onClick={redo}
            icon={<Redo2 className="size-4" />}
          />
        </div>

        <span className="mx-0.5 hidden h-5 w-px bg-slate-200 md:block" aria-hidden />

        <ButtonLink
          href={`/admin/forms/${form.id}/responses`}
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
          icon={<Inbox className="size-4" />}
        >
          <span className="hidden lg:inline">Responses</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums text-slate-600">
            {form.responseCount}
          </span>
        </ButtonLink>

        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          title="Preview the form"
          icon={<Eye className="size-4" />}
        >
          <span className="hidden md:inline">Preview</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void copyLink()}
          title="Copy the share link"
          icon={<Share2 className="size-4" />}
        >
          <span className="hidden md:inline">Share</span>
        </Button>

        {live ? (
          <Dropdown
            align="right"
            items={publishedItems}
            trigger={
              <button
                type="button"
                title="Publishing options"
                aria-haspopup="menu"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-[13px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                )}
                Published
                <ChevronDown className="size-3.5 opacity-70" aria-hidden />
              </button>
            }
          />
        ) : (
          <Button
            size="sm"
            onClick={() => void changeStatus("published")}
            loading={busy === "published"}
            icon={<Rocket className="size-4" />}
            title="Publish this form and get a shareable link"
          >
            Publish
          </Button>
        )}
      </div>
    </header>
  );
}

function IconButton({
  label,
  title,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/40 disabled:pointer-events-none disabled:opacity-35"
    >
      {icon}
    </button>
  );
}

/** Ticks every 30s on the client, and stays null on the server so the
 *  relative timestamp can never mismatch the server-rendered HTML. */
const subscribeToClock = (onChange: () => void) => {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
};
const readClock = () => Math.floor(Date.now() / 30_000);
const readServerClock = () => null;

function SaveStatus({
  saving,
  dirty,
  lastSavedAt,
}: {
  saving: boolean;
  dirty: boolean;
  lastSavedAt: string | null;
}) {
  const clock = useSyncExternalStore<number | null>(
    subscribeToClock,
    readClock,
    readServerClock,
  );

  const base =
    "hidden flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium sm:inline-flex";

  if (saving) {
    return (
      <span className={cn(base, "bg-slate-100 text-slate-600")} role="status">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }

  if (dirty) {
    return (
      <span className={cn(base, "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200")} role="status">
        <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
        Unsaved changes
      </span>
    );
  }

  return (
    <span className={cn(base, "text-slate-400")} role="status">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      All changes saved
      {lastSavedAt && clock !== null ? (
        <span className="hidden lg:inline">· {relativeTime(lastSavedAt)}</span>
      ) : null}
    </span>
  );
}
