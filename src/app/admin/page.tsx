import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { getSessionUser } from "@/lib/auth";
import { listForms } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Every form you have built, with responses at a glance.",
};

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  // The layout already guards this route; this keeps `user` non-null for TypeScript.
  if (!user) redirect("/login");

  const { forms, stats } = await listForms(user.id);

  return (
    <AdminShell user={user}>
      <DashboardClient initialForms={forms} initialStats={stats} />
    </AdminShell>
  );
}
