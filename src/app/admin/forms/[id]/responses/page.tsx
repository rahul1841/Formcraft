import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResponsesClient } from "@/components/admin/ResponsesClient";
import { computeAnalytics } from "@/lib/analytics";
import { getSessionUser } from "@/lib/auth";
import { allSubmissions, getFormForOwner, listSubmissions } from "@/lib/data";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return { title: "Responses" };
  const form = await getFormForOwner(user.id, id);
  return { title: form ? `${form.title} — Responses` : "Responses" };
}

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const form = await getFormForOwner(user.id, id);
  if (!form) notFound();

  const [initial, everySubmission] = await Promise.all([
    listSubmissions(form.id, { page: 1, limit: PAGE_SIZE }),
    allSubmissions(form.id),
  ]);

  const analytics = computeAnalytics(form, everySubmission);

  return (
    <AdminShell user={user}>
      <ResponsesClient form={form} initial={initial} analytics={analytics} />
    </AdminShell>
  );
}
