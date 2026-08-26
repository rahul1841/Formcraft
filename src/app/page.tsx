import Link from "next/link";
import {
  ArrowRight,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  Inbox,
  Link2,
  Mail,
  MousePointerClick,
  Palette,
  Rocket,
  Send,
  Shapes,
  Sparkles,
  Star,
  Type,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Drag-and-drop builder",
    body: "Grab a field, drop it on the canvas, reorder it later. Every change previews itself instantly — no saving and refreshing to find out what you built.",
  },
  {
    icon: Shapes,
    title: "18 field types",
    body: "Text, email, phone, numbers, dates, dropdowns, multi-select, ratings, sliders, consent checkboxes, headings and dividers. Half-width and third-width layouts included.",
  },
  {
    icon: Palette,
    title: "Full styling control",
    body: "Colours, fonts, corner radius, spacing, input and button styles, background patterns and cover images. Start from a preset or tune every token yourself.",
  },
  {
    icon: Link2,
    title: "Shareable links",
    body: "Publishing gives your form its own clean URL. Send it anywhere — it loads fast, works on any phone and never asks the respondent to sign in.",
  },
  {
    icon: Inbox,
    title: "Response management",
    body: "Read answers one by one or scan them in a table, search across everything that came in, and delete what you no longer need.",
  },
  {
    icon: ChartColumn,
    title: "Analytics and CSV export",
    body: "Response trends over time, per-question breakdowns, completion rate and average fill time — plus a one-click CSV or JSON export for the rest.",
  },
];

const STEPS = [
  {
    icon: Sparkles,
    title: "Build it",
    body: "Start blank or from a template, then drop in the questions you need and set validation rules per field.",
  },
  {
    icon: Rocket,
    title: "Publish it",
    body: "Pick a theme, write your thank-you message, and hit publish to get a link you can share right away.",
  },
  {
    icon: ChartColumn,
    title: "Read the answers",
    body: "Responses stream into your dashboard with charts, per-question summaries and exports whenever you need them.",
  },
];

const PALETTE_CHIPS = [
  { icon: Type, label: "Short text" },
  { icon: Mail, label: "Email" },
  { icon: Star, label: "Rating" },
  { icon: ChevronDown, label: "Dropdown" },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ------------------------------- header ------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30">
              <Shapes className="size-4.5" aria-hidden />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Formcraft</span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-slate-600 md:flex">
            <a
              href="#features"
              className="rounded transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="rounded transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              How it works
            </a>
          </nav>

          {user ? (
            <ButtonLink
              href="/admin"
              size="sm"
              iconRight={<ArrowRight className="size-4" aria-hidden />}
            >
              Go to dashboard
            </ButtonLink>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Get started free
              </ButtonLink>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* -------------------------------- hero -------------------------------- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.16),transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent"
          />

          <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[12.5px] font-medium text-brand-700">
                <Sparkles className="size-3.5" aria-hidden />
                No-code form builder
              </span>

              <h1 className="mt-5 text-[38px] font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-[52px] lg:text-[56px]">
                Build the form.
                <br />
                <span className="text-brand-600">Skip the code.</span>
              </h1>

              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-slate-600 sm:text-[17px]">
                Formcraft turns a blank canvas into a polished, publishable form — drag
                in the questions, style it to match your brand, share one link, and let
                the responses analyse themselves.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {user ? (
                  <ButtonLink
                    href="/admin"
                    size="lg"
                    className="w-full sm:w-auto"
                    iconRight={<ArrowRight className="size-4.5" aria-hidden />}
                  >
                    Go to dashboard
                  </ButtonLink>
                ) : (
                  <>
                    <ButtonLink
                      href="/register"
                      size="lg"
                      className="w-full sm:w-auto"
                      iconRight={<ArrowRight className="size-4.5" aria-hidden />}
                    >
                      Start building free
                    </ButtonLink>
                    <ButtonLink
                      href="/login"
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Sign in
                    </ButtonLink>
                  </>
                )}
              </div>

              <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[13px] text-slate-500">
                {["No credit card", "Unlimited forms", "Export anytime"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-4 text-brand-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ---------------------- hand-built builder mock ---------------------- */}
            <div aria-hidden className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-brand-200/50 via-brand-100/30 to-transparent blur-2xl" />

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                {/* window chrome */}
                <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-slate-300" />
                  <span className="size-2.5 rounded-full bg-slate-300" />
                  <span className="size-2.5 rounded-full bg-slate-300" />
                  <span className="ml-3 hidden truncate rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-slate-200 sm:block">
                    formcraft.app/admin/forms/edit
                  </span>
                </div>

                <div className="grid grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[132px_minmax(0,1fr)]">
                  {/* field palette */}
                  <div className="space-y-2 border-r border-slate-100 bg-slate-50/60 p-3 sm:p-4">
                    <p className="px-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Fields
                    </p>
                    {PALETTE_CHIPS.map(({ icon: Icon, label }, index) => (
                      <div
                        key={label}
                        className={
                          "flex items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-[11px] font-medium sm:px-2.5 " +
                          (index === 1
                            ? "border-brand-300 text-brand-700 shadow-sm shadow-brand-600/10"
                            : "border-slate-200 text-slate-500")
                        }
                      >
                        <Icon
                          className={
                            "size-3.5 flex-none " +
                            (index === 1 ? "text-brand-600" : "text-slate-400")
                          }
                        />
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                    <div className="mt-3 h-16 rounded-lg border border-dashed border-slate-200" />
                  </div>

                  {/* form canvas */}
                  <div className="bg-[radial-gradient(rgba(148,163,184,0.28)_1px,transparent_1px)] [background-size:14px_14px] p-4 sm:p-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="h-2.5 w-28 rounded-full bg-slate-800/85" />
                      <div className="mt-2 h-2 w-40 rounded-full bg-slate-200" />

                      <div className="mt-5 space-y-3.5">
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-16 rounded-full bg-slate-300" />
                          <div className="h-8 rounded-lg border border-slate-200 bg-slate-50" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-20 rounded-full bg-slate-300" />
                          <div className="h-8 rounded-lg border-2 border-brand-400 bg-white ring-4 ring-brand-500/15" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-medium text-brand-700 ring-1 ring-brand-200">
                            Weekly
                          </span>
                          <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200">
                            Monthly
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-[11px] font-semibold text-white shadow-sm shadow-brand-600/30">
                        <Send className="size-3" />
                        Submit
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* floating stat card */}
              <div className="absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-lg shadow-slate-900/10 backdrop-blur sm:flex lg:-left-8">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ChartColumn className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold leading-none text-slate-900">
                    1,284 responses
                  </p>
                  <p className="mt-1 text-[11px] leading-none text-slate-500">
                    92% completion rate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ features ------------------------------ */}
        <section
          id="features"
          className="scroll-mt-20 border-y border-slate-200 bg-slate-50/70"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-brand-600">
                Everything included
              </p>
              <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[38px]">
                A builder, a renderer and an analytics suite in one place
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
                No plugins to bolt on and no separate spreadsheet to babysit. The
                pieces you need to collect an answer well are already here.
              </p>
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md hover:shadow-brand-600/5"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------- how it works ---------------------------- */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-brand-600">
                How it works
              </p>
              <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[38px]">
                Three steps from idea to answers
              </h2>
            </div>

            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="relative">
                  {/* connector, drawn between cards on wide screens only */}
                  {index < STEPS.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute left-full top-6 hidden h-px w-6 bg-slate-200 md:block"
                    />
                  ) : null}
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 flex-none place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-slate-600">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ----------------------------- closing CTA ---------------------------- */}
        <section className="px-5 pb-20 sm:px-8 sm:pb-24">
          <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-brand-600 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.25),transparent_55%),radial-gradient(circle_at_85%_100%,rgba(49,46,129,0.7),transparent_60%)]"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[40px]">
                Your next form is about ten minutes away
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-brand-100 sm:text-[16px]">
                Create an account, pick a template, and publish something people can
                actually fill in today.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={user ? "/admin" : "/register"}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-brand-700 shadow-sm transition-all hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:w-auto"
                >
                  {user ? "Go to dashboard" : "Create your free account"}
                  <ArrowRight className="size-4.5" aria-hidden />
                </Link>
                {user ? null : (
                  <Link
                    href="/login"
                    className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl px-5 text-[15px] font-medium text-white ring-1 ring-white/35 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:w-auto"
                  >
                    I already have an account
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------- footer ------------------------------- */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-white">
              <Shapes className="size-4" aria-hidden />
            </span>
            <span className="text-[14px] font-semibold tracking-tight text-slate-900">
              Formcraft
            </span>
          </div>

          <nav className="flex items-center gap-6 text-[13px] font-medium text-slate-500">
            <a
              href="#features"
              className="rounded transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="rounded transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              How it works
            </a>
            <Link
              href={user ? "/admin" : "/login"}
              className="rounded transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </nav>

          <p className="text-[12.5px] text-slate-400">
            &copy; {new Date().getFullYear()} Formcraft
          </p>
        </div>
      </footer>
    </div>
  );
}
