"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChartColumnBig,
  ChevronDown,
  Download,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  MoreHorizontal,
  SquarePen,
  Table2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dropdown } from "@/components/ui/Dropdown";
import { StatusBadge } from "@/components/ui/Badge";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { ResponsesTable, RESPONSES_PAGE_SIZE } from "@/components/admin/ResponsesTable";
import { AnalyticsPanel } from "@/components/analytics/AnalyticsPanel";
import { api, ApiError } from "@/lib/api-client";
import { pluralize } from "@/lib/utils";
import type { Form, FormAnalytics, Submission } from "@/lib/types";

export interface ResponsePage {
  submissions: Submission[];
  total: number;
  page: number;
  pages: number;
}

type TabId = "responses" | "summary";

const SEARCH_DEBOUNCE_MS = 350;

export function ResponsesClient({
  form,
  initial,
  analytics,
}: {
  form: Form;
  initial: ResponsePage;
  analytics: FormAnalytics;
}) {
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<TabId>("responses");
  const [data, setData] = useState<ResponsePage>(initial);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  // The server already rendered page 1 with no search — don't refetch it on mount.
  const skipFirstFetch = useRef(true);

  const totalResponses = analytics.totalResponses;

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(RESPONSES_PAGE_SIZE),
    });
    if (search) query.set("search", search);

    api
      .get<ResponsePage>(`/api/forms/${form.id}/responses?${query.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // A deletion can leave us past the last page.
        if (res.page > res.pages) setPage(res.pages);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load responses. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.id, page, search, reloadToken]);

  /** Refetch the current page and let the server recompute the summary. */
  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
    router.refresh();
  }, [router]);

  /** The export endpoint streams a file, so trigger it as a download, not a fetch. */
  const download = useCallback(
    (format: "csv" | "json") => {
      const link = document.createElement("a");
      link.href = `/api/forms/${form.id}/export?format=${format}`;
      link.rel = "noopener";
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [form.id],
  );

  const clearAll = async () => {
    try {
      const res = await api.del<{ deleted: number }>(`/api/forms/${form.id}/responses`);
      toast.success(`${pluralize(res.deleted, "response")} deleted`);
      setSearchInput("");
      setSearch("");
      setPage(1);
      setData({ submissions: [], total: 0, page: 1, pages: 1 });
      refresh();
    } catch (err) {
      toast.error(
        "Could not delete responses",
        err instanceof ApiError ? err.message : "Please try again.",
      );
    }
  };

  const tabs: TabItem<TabId>[] = [
    {
      id: "responses",
      label: "Responses",
      icon: <Table2 className="size-4" />,
      count: totalResponses,
    },
    { id: "summary", label: "Summary", icon: <ChartColumnBig className="size-4" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All forms
        </Link>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight break-words text-slate-900 sm:text-2xl">
                {form.title}
              </h1>
              <StatusBadge status={form.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {pluralize(totalResponses, "response")} collected
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {form.status === "published" ? (
              <ButtonLink
                href={`/f/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                variant="outline"
                size="sm"
                icon={<ExternalLink className="size-4" />}
              >
                Open live form
              </ButtonLink>
            ) : null}

            <ButtonLink
              href={`/admin/forms/${form.id}/edit`}
              variant="outline"
              size="sm"
              icon={<SquarePen className="size-4" />}
            >
              Edit form
            </ButtonLink>

            <Dropdown
              align="right"
              trigger={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download className="size-4" />}
                  iconRight={<ChevronDown className="size-3.5 opacity-70" />}
                  aria-haspopup="menu"
                >
                  Export
                </Button>
              }
              items={[
                {
                  label: "Download CSV",
                  icon: <FileSpreadsheet className="size-4 text-slate-400" />,
                  onSelect: () => download("csv"),
                  disabled: totalResponses === 0,
                },
                {
                  label: "Download JSON",
                  icon: <FileJson className="size-4 text-slate-400" />,
                  onSelect: () => download("json"),
                  disabled: totalResponses === 0,
                },
              ]}
            />

            {totalResponses > 0 ? (
              <Dropdown
                align="right"
                trigger={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="More actions"
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
                items={[
                  {
                    label: "Delete all responses",
                    icon: <Trash2 className="size-4" />,
                    tone: "danger",
                    onSelect: () => setConfirmClear(true),
                  },
                ]}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Tabs<TabId> tabs={tabs} value={tab} onChange={setTab} />

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"
        >
          <span className="flex items-center gap-2">
            <TriangleAlert className="size-4 flex-none" aria-hidden />
            {error}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadToken((token) => token + 1)}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {tab === "responses" ? (
        <div role="tabpanel" aria-label="Responses">
          <ResponsesTable
            form={form}
            submissions={data.submissions}
            total={data.total}
            page={data.page}
            pages={data.pages}
            loading={loading}
            search={searchInput}
            onSearch={setSearchInput}
            onPage={setPage}
            onDeleted={refresh}
          />
        </div>
      ) : (
        <div role="tabpanel" aria-label="Summary">
          <AnalyticsPanel analytics={analytics} form={form} />
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAll}
        title="Delete all responses?"
        description={`All ${pluralize(totalResponses, "response")} for “${form.title}” will be permanently deleted, along with every chart and summary built from them. This cannot be undone.`}
        confirmLabel="Delete everything"
      />
    </div>
  );
}
