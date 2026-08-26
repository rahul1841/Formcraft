"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Globe,
  Inbox,
  PenLine,
  Plus,
  Search,
  SearchX,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { SegmentedControl, type SegmentOption } from "@/components/ui/SegmentedControl";
import { Spinner } from "@/components/ui/Spinner";
import { CreateFormModal } from "@/components/admin/CreateFormModal";
import { FormCard } from "@/components/admin/FormCard";
import { ShareModal } from "@/components/admin/ShareModal";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { FormSummary } from "@/lib/types";

/** Mirrors `DashboardStats` from @/lib/data, declared here to keep this bundle client-safe. */
export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  responses: number;
}

type StatusFilter = "all" | "published" | "draft" | "closed";
type SortOption = "recent" | "created" | "title" | "responses";

interface FormsPayload {
  forms: FormSummary[];
  stats: DashboardStats;
}

const STATUS_OPTIONS: SegmentOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Live" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Last edited" },
  { value: "created", label: "Recently created" },
  { value: "title", label: "Title (A–Z)" },
  { value: "responses", label: "Most responses" },
];

export function DashboardClient({
  initialForms,
  initialStats,
}: {
  initialForms: FormSummary[];
  initialStats: DashboardStats;
}) {
  const [forms, setForms] = useState(initialForms);
  const [stats, setStats] = useState(initialStats);

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("recent");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<FormSummary | null>(null);

  /* Debounce the search box so typing does not fire a request per keystroke. */
  useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(timer);
  }, [search, query]);

  const isFirstRun = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    // The first render already has server-rendered data; don't refetch it.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const id = ++requestId.current;
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (status !== "all") params.set("status", status);
    params.set("sort", sort);

    setLoading(true);
    setError(null);

    api
      .get<FormsPayload>(`/api/forms?${params.toString()}`)
      .then((data) => {
        if (requestId.current !== id) return;
        setForms(data.forms);
        setStats(data.stats);
      })
      .catch((err: unknown) => {
        if (requestId.current !== id) return;
        setError(err instanceof Error ? err.message : "We couldn't load your forms.");
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
  }, [query, status, sort, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setQuery("");
    setStatus("all");
  }, []);

  const filtersActive = query.trim() !== "" || status !== "all";
  const showSkeleton = loading && forms.length === 0 && !error;

  const tiles = useMemo(
    () => [
      {
        key: "total",
        label: "Total forms",
        value: stats.total,
        icon: <FileText className="size-3.5" aria-hidden />,
        tone: "bg-slate-100 text-slate-600",
      },
      {
        key: "published",
        label: "Live",
        value: stats.published,
        icon: <Globe className="size-3.5" aria-hidden />,
        tone: "bg-emerald-50 text-emerald-600",
      },
      {
        key: "drafts",
        label: "Drafts",
        value: stats.drafts,
        icon: <PenLine className="size-3.5" aria-hidden />,
        tone: "bg-amber-50 text-amber-600",
      },
      {
        key: "responses",
        label: "Total responses",
        value: stats.responses,
        icon: <Inbox className="size-3.5" aria-hidden />,
        tone: "bg-brand-50 text-brand-600",
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Your forms
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Build, publish and track every form from one place.
          </p>
        </div>
        <Button
          icon={<Plus className="size-4" aria-hidden />}
          onClick={() => setCreateOpen(true)}
          className="w-full sm:w-auto"
        >
          New form
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.key} className="p-4">
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-slate-500">
              <span className={cn("grid size-6 flex-none place-items-center rounded-md", tile.tone)}>
                {tile.icon}
              </span>
              <span className="truncate">{tile.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {tile.value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search forms…"
            aria-label="Search forms"
            icon={<Search className="size-4" aria-hidden />}
          />
          {loading ? (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
              <Spinner className="size-4" />
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
          <SegmentedControl
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            fullWidth={false}
            className="w-full sm:w-auto"
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            options={SORT_OPTIONS}
            aria-label="Sort forms"
            wrapperClassName="w-full sm:w-48"
          />
        </div>
      </div>

      {error ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <TriangleAlert className="size-6 text-amber-500" aria-hidden />
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              We couldn&apos;t load your forms
            </h3>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} loading={loading}>
            Try again
          </Button>
        </Card>
      ) : showSkeleton ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <FormCardSkeleton key={i} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        filtersActive ? (
          <EmptyState
            className="py-10"
            icon={<SearchX className="size-5" aria-hidden />}
            title="No forms match your filters"
            description="Try a different search term or switch the status filter back to All."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<FileText className="size-5" aria-hidden />}
            title="Create your first form"
            description="Start from a ready-made template or a blank canvas — then publish and share it in a click."
            action={
              <Button
                icon={<Plus className="size-4" aria-hidden />}
                onClick={() => setCreateOpen(true)}
              >
                New form
              </Button>
            }
          />
        )
      ) : (
        <div
          aria-busy={loading}
          className={cn(
            "grid gap-4 transition-opacity duration-150 sm:grid-cols-2 xl:grid-cols-3",
            loading && "pointer-events-none opacity-60",
          )}
        >
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onShare={setShareTarget}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      <CreateFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ShareModal form={shareTarget} onClose={() => setShareTarget(null)} />
    </div>
  );
}

function FormCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-0.5 w-full bg-slate-200" />
      <div className="animate-pulse space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-2/5 rounded bg-slate-200" />
          <div className="h-5 w-14 rounded-full bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-3/5 rounded bg-slate-100" />
        </div>
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
        <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </Card>
  );
}
