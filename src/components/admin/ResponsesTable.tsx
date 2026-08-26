"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Search,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ResponseDetailModal } from "@/components/admin/ResponseDetailModal";
import { api, ApiError } from "@/lib/api-client";
import { isAnswerable } from "@/lib/constants";
import { answerToText, cn, formatDate, pluralize, relativeTime, truncate } from "@/lib/utils";
import type { Form, Submission } from "@/lib/types";

/** Kept here so the running row number and the fetch limit can never drift apart. */
export const RESPONSES_PAGE_SIZE = 25;

const CELL_MAX = 60;
const HEADER_MAX = 24;

export interface ResponsesTableProps {
  form: Form;
  submissions: Submission[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  onPage: (page: number) => void;
  onDeleted: () => void;
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, row) => (
        <tr key={row} className="border-t border-slate-100">
          {Array.from({ length: columns }, (_, col) => (
            <td key={col} className="px-4 py-3.5">
              <div
                className="h-3 animate-pulse rounded-full bg-slate-100"
                style={{ width: col === 0 ? 20 : col === 1 ? 96 : `${60 + ((row * 7 + col * 13) % 35)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ResponsesTable({
  form,
  submissions,
  total,
  page,
  pages,
  loading,
  search,
  onSearch,
  onPage,
  onDeleted,
}: ResponsesTableProps) {
  const toast = useToast();
  const [active, setActive] = useState<Submission | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Submission | null>(null);

  const columns = form.fields.filter((f) => isAnswerable(f.type));
  const columnCount = columns.length + 3;

  const removeSubmission = async () => {
    if (!pendingDelete) return;
    try {
      await api.del(`/api/forms/${form.id}/responses/${pendingDelete.id}`);
      toast.success("Response deleted");
      if (active?.id === pendingDelete.id) setActive(null);
      onDeleted();
    } catch (err) {
      toast.error(
        "Could not delete response",
        err instanceof ApiError ? err.message : "Please try again.",
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative w-full sm:max-w-xs">
          <Input
            type="text"
            inputMode="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search responses…"
            aria-label="Search responses"
            icon={<Search className="size-4" />}
            className={cn(search && "pr-9")}
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <p className="flex-none text-[13px] text-slate-500 tabular-nums" aria-live="polite">
          {pluralize(total, "response")}
          {search ? " matching" : ""}
        </p>
      </div>

      {!loading && submissions.length === 0 ? (
        <div className="p-4 sm:p-5">
          {search ? (
            <EmptyState
              icon={<SearchX className="size-5" />}
              title="No responses match your search"
              description={`Nothing found for “${truncate(search, 40)}”. Try a shorter or different term.`}
              action={
                <Button variant="outline" size="sm" onClick={() => onSearch("")}>
                  Clear search
                </Button>
              }
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <EmptyState
              icon={<Inbox className="size-5" />}
              title="No responses yet"
              description={
                <>
                  Share your form link{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-700">
                    /f/{form.slug}
                  </code>{" "}
                  and answers will land here in real time.
                </>
              }
              className="border-0 bg-transparent py-10"
            />
          )}
        </div>
      ) : (
        <div className="max-h-[62vh] overflow-auto">
          <table className="w-full min-w-max border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="text-[11.5px] font-semibold tracking-wide text-slate-500 uppercase">
                <th scope="col" className="w-12 px-4 py-2.5 font-semibold">
                  #
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  Submitted
                </th>
                {columns.map((field) => (
                  <th
                    key={field.id}
                    scope="col"
                    className="px-4 py-2.5 font-semibold"
                    title={field.label}
                  >
                    {truncate(field.label || field.type, HEADER_MAX)}
                  </th>
                ))}
                <th scope="col" className="w-24 px-4 py-2.5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows columns={columnCount} />
              ) : (
                submissions.map((submission, index) => (
                  <tr
                    key={submission.id}
                    tabIndex={0}
                    onClick={() => setActive(submission)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActive(submission);
                      }
                    }}
                    className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-inset"
                  >
                    <td className="px-4 py-3 text-[13px] text-slate-400 tabular-nums">
                      {(page - 1) * RESPONSES_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-[13px] font-medium text-slate-800">
                        {formatDate(submission.submittedAt)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {relativeTime(submission.submittedAt)}
                      </div>
                    </td>
                    {columns.map((field) => {
                      const text = answerToText(submission.data?.[field.id] ?? null, field);
                      return (
                        <td
                          key={field.id}
                          className="px-4 py-3 text-[13px] text-slate-700"
                          title={text || undefined}
                        >
                          <div className="max-w-[280px] truncate">
                            {text ? (
                              truncate(text, CELL_MAX)
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label="View response"
                          title="View response"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActive(submission);
                          }}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete response"
                          title="Delete response"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(submission);
                          }}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-[13px] text-slate-500 tabular-nums">
            Page {page} of {pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => onPage(page - 1)}
              icon={<ChevronLeft className="size-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages || loading}
              onClick={() => onPage(page + 1)}
              iconRight={<ChevronRight className="size-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ResponseDetailModal form={form} submission={active} onClose={() => setActive(null)} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={removeSubmission}
        title="Delete this response?"
        description="This response will be permanently removed and the analytics will be recalculated. This cannot be undone."
        confirmLabel="Delete response"
      />
    </Card>
  );
}
