import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/**
 * Auth guard only — no chrome. The builder at /admin/forms/[id]/edit renders its
 * own full-screen layout, so each page brings its own <AdminShell> when it wants one.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
