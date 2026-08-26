"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { useBuilder } from "@/components/builder/builder-context";
import { FormRenderer } from "@/components/form/FormRenderer";
import { Button } from "@/components/ui/Button";
import { SegmentedControl, type SegmentOption } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/utils";

type Device = "mobile" | "tablet" | "desktop";

const DEVICE_WIDTH: Record<Device, string> = {
  mobile: "390px",
  tablet: "768px",
  desktop: "100%",
};

const DEVICE_OPTIONS: SegmentOption<Device>[] = [
  {
    value: "mobile",
    title: "Phone — 390px wide",
    icon: <Smartphone className="size-4" />,
    label: <span className="hidden sm:inline">Phone</span>,
  },
  {
    value: "tablet",
    title: "Tablet — 768px wide",
    icon: <Tablet className="size-4" />,
    label: <span className="hidden sm:inline">Tablet</span>,
  },
  {
    value: "desktop",
    title: "Desktop — full width",
    icon: <Monitor className="size-4" />,
    label: <span className="hidden sm:inline">Desktop</span>,
  },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PreviewModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { previewForm } = useBuilder();
  const [device, setDevice] = useState<Device>("desktop");
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape to close, body scroll lock, and focus restored to the opener.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  // `open` can only become true from a click, so document access is safe here.
  if (!open) return null;

  const trapTab = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const nodes = overlayRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes?.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${previewForm.title}`}
      onKeyDown={trapTab}
      className="fixed inset-0 z-90 flex animate-fade-in flex-col bg-slate-900/50 backdrop-blur-[2px]"
    >
      <header className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:h-14 sm:flex-nowrap sm:py-0">
        <div className="order-1 min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {previewForm.title}
          </p>
          <p className="truncate text-[11.5px] text-slate-500">
            Live preview — answers are never submitted
          </p>
        </div>

        <SegmentedControl
          value={device}
          onChange={setDevice}
          options={DEVICE_OPTIONS}
          size="sm"
          fullWidth={false}
          className="order-3 w-full sm:order-2 sm:w-auto"
        />

        <Button
          ref={closeRef}
          variant="outline"
          size="sm"
          onClick={onClose}
          icon={<X className="size-4" />}
          className="order-2 sm:order-3"
          title="Close preview (Esc)"
        >
          Close
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-200/80 p-3 sm:p-6">
        <div
          className="mx-auto transition-[width] duration-200"
          style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
        >
          <div
            className={cn(
              "min-h-[60vh] overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-2xl shadow-slate-900/25",
            )}
          >
            <FormRenderer form={previewForm} mode="preview" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
