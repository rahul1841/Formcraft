import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Formcraft workspace to build forms and read responses.",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return <AuthForm mode="login" />;
}
