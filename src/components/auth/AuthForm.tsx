"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shapes,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldShell, Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/types";

/**
 * Mirrors the styling of the shared <Input> control. The password field builds
 * its own input row so the show/hide button can sit inside the control.
 */
const CONTROL =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-all placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const CONTROL_OK = "border-slate-300 focus:border-brand-500 focus:ring-brand-500/15";
const CONTROL_ERR = "border-red-400 focus:border-red-500 focus:ring-red-500/15";

const MIN_PASSWORD = 8;

type FieldName = "name" | "email" | "password";

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to keep building and to see your latest responses.",
    submit: "Sign in",
    endpoint: "/api/auth/login",
    switchText: "New to Formcraft?",
    switchCta: "Create an account",
    switchHref: "/register",
  },
  register: {
    title: "Create your account",
    subtitle: "Set up your workspace and publish your first form in minutes.",
    submit: "Create account",
    endpoint: "/api/auth/register",
    switchText: "Already have an account?",
    switchCta: "Sign in instead",
    switchHref: "/login",
  },
} as const;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const copy = COPY[mode];
  const isRegister = mode === "register";
  const router = useRouter();
  const toast = useToast();

  const passwordId = useId();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    const payload = isRegister
      ? { name: values.name.trim(), email: values.email.trim(), password: values.password }
      : { email: values.email.trim(), password: values.password };

    try {
      await api.post<{ user: AuthUser }>(copy.endpoint, payload);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors as Partial<Record<FieldName, string>>);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      toast.error(
        isRegister ? "Could not create your account" : "Could not sign you in",
        err instanceof ApiError ? err.message : undefined,
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="lg:hidden">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Shapes className="size-4.5" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            Formcraft
          </span>
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[26px]">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.subtitle}</p>

      {formError ? (
        <div
          role="alert"
          className="mt-6 flex animate-fade-in items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] leading-relaxed text-red-700"
        >
          <CircleAlert className="mt-px size-4 flex-none" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isRegister ? (
          <Input
            label="Full name"
            name="name"
            type="text"
            required
            autoComplete="name"
            autoFocus
            maxLength={80}
            placeholder="Ada Lovelace"
            icon={<User className="size-4" aria-hidden />}
            value={values.name}
            error={fieldErrors.name}
            onChange={(e) => update("name", e.target.value)}
            disabled={submitting}
          />
        ) : null}

        <Input
          label="Email address"
          name="email"
          type="email"
          required
          autoComplete={isRegister ? "email" : "username"}
          autoFocus={!isRegister}
          inputMode="email"
          placeholder="you@company.com"
          icon={<Mail className="size-4" aria-hidden />}
          value={values.email}
          error={fieldErrors.email}
          onChange={(e) => update("email", e.target.value)}
          disabled={submitting}
        />

        <FieldShell
          label="Password"
          htmlFor={passwordId}
          required
          error={fieldErrors.password}
          hint={isRegister ? `At least ${MIN_PASSWORD} characters.` : undefined}
        >
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden
            >
              <Lock className="size-4" />
            </span>
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={MIN_PASSWORD}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "At least 8 characters" : "Your password"}
              value={values.password}
              disabled={submitting}
              aria-invalid={fieldErrors.password ? true : undefined}
              onChange={(e) => update("password", e.target.value)}
              className={cn(
                CONTROL,
                fieldErrors.password ? CONTROL_ERR : CONTROL_OK,
                "pl-9.5 pr-11",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-lg text-slate-400 transition-colors hover:text-slate-700 focus-visible:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </FieldShell>

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          className="w-full"
          disabled={submitting}
        >
          {submitting ? (isRegister ? "Creating account…" : "Signing in…") : copy.submit}
        </Button>
      </form>

      {isRegister ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-slate-500">
          <ShieldCheck className="mt-px size-4 flex-none text-brand-600" aria-hidden />
          <span>
            Your account is an admin account — you can build forms, publish them and
            read every response they collect.
          </span>
        </p>
      ) : null}

      <p className="mt-7 text-center text-[13px] text-slate-500">
        {copy.switchText}{" "}
        <Link
          href={copy.switchHref}
          className="rounded font-medium text-brand-600 underline-offset-4 transition-colors hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
        >
          {copy.switchCta}
        </Link>
      </p>
    </div>
  );
}
