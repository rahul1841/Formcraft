"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Layers, LogOut } from "lucide-react";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api-client";
import { initials } from "@/lib/utils";
import type { AuthUser } from "@/lib/types";

export function AdminShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await api.post("/api/auth/logout");
      router.push("/login");
      router.refresh();
    } catch (err) {
      setSigningOut(false);
      toast.error(
        "Could not sign out",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const items: DropdownItem[] = [
    {
      // Identity header for the menu; selecting it simply closes the popover.
      label: "",
      onSelect: () => {},
      icon: (
        <span className="flex w-56 max-w-full items-center gap-2.5 py-0.5">
          <span className="grid size-8 flex-none place-items-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
            {initials(user.name) || user.email[0]?.toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-slate-900">
              {user.name}
            </span>
            <span className="block truncate text-[12px] font-normal text-slate-500">
              {user.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      label: signingOut ? "Signing out…" : "Sign out",
      icon: <LogOut className="size-4" aria-hidden />,
      onSelect: signOut,
      disabled: signingOut,
      separatorBefore: true,
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Layers className="size-4.5" aria-hidden />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              Formcraft
            </span>
          </Link>

          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                aria-haspopup="menu"
                aria-label={`Account menu for ${user.name}`}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-2 pl-1 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
              >
                <span className="grid size-7 flex-none place-items-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                  {initials(user.name) || user.email[0]?.toUpperCase()}
                </span>
                <span className="hidden max-w-32 truncate text-[13px] font-medium text-slate-700 sm:block">
                  {user.name}
                </span>
                {signingOut ? (
                  <Spinner className="size-4" />
                ) : (
                  <ChevronDown className="size-4 flex-none text-slate-400" aria-hidden />
                )}
              </button>
            }
            items={items}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
