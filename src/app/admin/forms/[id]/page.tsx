import { redirect } from "next/navigation";

/** /admin/forms/:id has no page of its own — the builder is the canonical view. */
export default async function FormIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/forms/${id}/edit`);
}
