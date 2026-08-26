import type { Metadata } from "next";
import { Compass, House, LayoutDashboard } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-12 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-100/60 to-transparent"
      />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Compass className="size-7" strokeWidth={2} aria-hidden />
          </div>

          <p className="mt-5 text-[13px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Error 404
          </p>

          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            We couldn&apos;t find that page
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            The form may have been deleted or unpublished, or the link might have
            been mistyped. Double-check the address and try again.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <ButtonLink
              href="/"
              variant="outline"
              size="md"
              icon={<House className="size-4" aria-hidden />}
              className="w-full sm:w-auto"
            >
              Back home
            </ButtonLink>
            <ButtonLink
              href="/admin"
              variant="primary"
              size="md"
              icon={<LayoutDashboard className="size-4" aria-hidden />}
              className="w-full sm:w-auto"
            >
              Go to dashboard
            </ButtonLink>
          </div>
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-400">
          Built with <span className="font-semibold text-slate-500">Formcraft</span>
        </p>
      </div>
    </main>
  );
}
