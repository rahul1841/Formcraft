import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free Formcraft account and publish your first form in minutes.",
};

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return <AuthForm mode="register" />;
}
