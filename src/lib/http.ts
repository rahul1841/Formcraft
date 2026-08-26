import { NextResponse } from "next/server";
import { MissingMongoUriError } from "@/lib/db";
import { UnauthorizedError } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types";

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data } as const, { status });
}

export function fail(
  error: string,
  status = 400,
  fieldErrors?: Record<string, string>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ ok: false, error, fieldErrors } as const, {
    status,
  });
}

/** Maps thrown errors onto a consistent JSON error envelope. */
export function handleApiError(err: unknown): NextResponse<ApiResponse<never>> {
  if (err instanceof UnauthorizedError) return fail(err.message, 401);
  if (err instanceof MissingMongoUriError) return fail(err.message, 500);

  const message =
    err instanceof Error ? err.message : "Something went wrong. Please retry.";

  if (/E11000/.test(message)) {
    return fail("That value is already taken.", 409);
  }
  if (/ECONNREFUSED|ENOTFOUND|ServerSelection|querySrv/i.test(message)) {
    return fail(
      "Could not reach MongoDB. Check MONGODB_URI in .env.local and that your database allows this IP.",
      503,
    );
  }
  console.error("[api]", err);
  return fail(message, 500);
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}
