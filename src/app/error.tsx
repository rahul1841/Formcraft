"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbConfig = /MONGODB_URI|AUTH_SECRET/.test(error.message);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-red-50 text-red-600">
          <CircleAlert className="size-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {isDbConfig
            ? error.message
            : "We hit an unexpected error. Trying again usually fixes it."}
        </p>
        {isDbConfig ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-left font-mono text-[12px] text-slate-500">
            Copy .env.example to .env.local, fill it in, then restart the dev
            server.
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button onClick={reset} icon={<RefreshCw className="size-4" />}>
            Try again
          </Button>
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Back home
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-5 font-mono text-[11px] text-slate-400">
            Error ref: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
