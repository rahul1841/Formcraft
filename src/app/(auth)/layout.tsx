import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Shapes } from "lucide-react";

const HIGHLIGHTS = [
  "Drag-and-drop builder with 18 field types",
  "Publish to a shareable link in one click",
  "Live analytics and one-click CSV export",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form column */}
      <div className="relative flex flex-col bg-white">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/70 to-transparent lg:hidden" />

        <div className="relative flex justify-start px-5 pt-5 sm:px-8 sm:pt-7">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </div>

        <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
          {children}
        </main>

        <p className="relative px-5 pb-6 text-center text-[12px] text-slate-400 sm:px-8">
          &copy; {new Date().getFullYear()} Formcraft
        </p>
      </div>

      {/* Brand column */}
      <aside className="relative hidden overflow-hidden bg-brand-600 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.28),transparent_55%),radial-gradient(circle_at_10%_100%,rgba(49,46,129,0.65),transparent_60%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:44px_44px]"
        />

        <div className="relative flex items-center gap-2.5 px-12 pt-12">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
            <Shapes className="size-5" aria-hidden />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Formcraft
          </span>
        </div>

        <div className="relative px-12 pb-16">
          <p className="max-w-md text-[28px] font-semibold leading-[1.25] tracking-tight text-white xl:text-[32px]">
            Every form you need, without a single line of code.
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand-100">
            Build it, style it, share the link, and watch the answers land in a
            dashboard that already knows how to read them.
          </p>

          <ul className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-[14.5px] text-white">
                <span className="grid size-6 flex-none place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
                  <Check className="size-3.5" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
