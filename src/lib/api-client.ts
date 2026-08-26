"use client";

import type { ApiResponse } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** fetch() wrapper that unwraps the { ok, data } envelope and throws ApiError. */
export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const res = await fetch(input, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    /* non-JSON response (e.g. a crash page) */
  }

  if (!res.ok || !payload || payload.ok === false) {
    const message =
      payload && payload.ok === false
        ? payload.error
        : `Request failed (${res.status})`;
    throw new ApiError(
      message,
      res.status,
      payload && payload.ok === false ? payload.fieldErrors : undefined,
    );
  }

  return payload.data;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, json?: unknown) =>
    apiFetch<T>(url, { method: "POST", json: json ?? {} }),
  patch: <T>(url: string, json?: unknown) =>
    apiFetch<T>(url, { method: "PATCH", json: json ?? {} }),
  del: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
