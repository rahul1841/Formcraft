"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  description?: string;
}

interface ToastApi {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, description?: string) => {
      const id = ++counter;
      setItems((prev) => [...prev.slice(-3), { id, tone, message, description }]);
      setTimeout(() => remove(id), tone === "error" ? 6000 : 3800);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, d) => push("success", m, d),
      error: (m, d) => push("error", m, d),
      info: (m, d) => push("info", m, d),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg shadow-slate-900/10",
              item.tone === "success" && "border-emerald-200",
              item.tone === "error" && "border-red-200",
              item.tone === "info" && "border-slate-200",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex-none",
                item.tone === "success" && "text-emerald-600",
                item.tone === "error" && "text-red-600",
                item.tone === "info" && "text-brand-600",
              )}
            >
              {item.tone === "success" ? (
                <CircleCheck className="size-4.5" />
              ) : item.tone === "error" ? (
                <CircleAlert className="size-4.5" />
              ) : (
                <Info className="size-4.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{item.message}</p>
              {item.description ? (
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {item.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label="Dismiss"
              className="flex-none cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
