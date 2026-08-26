import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuilderProvider } from "@/components/builder/builder-context";
import { FormBuilder } from "@/components/builder/FormBuilder";
import { getSessionUser } from "@/lib/auth";
import { getFormForOwner } from "@/lib/data";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return { title: "Form builder" };

  const form = await getFormForOwner(user.id, id);
  return {
    title: form ? `Editing ${truncate(form.title, 48)}` : "Form builder",
    description: form?.description || "Build and customise your form.",
  };
}

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // The admin layout guards the segment; this keeps `user` non-null for TypeScript
  // and covers the session expiring between the layout render and this page.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const form = await getFormForOwner(user.id, id);
  if (!form) notFound();

  return (
    <BuilderProvider initialForm={form}>
      <FormBuilder />
    </BuilderProvider>
  );
}
