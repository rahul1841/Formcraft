import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { PublicFormClient } from "@/components/form/PublicFormClient";
import { getPublicFormBySlug } from "@/lib/data";
import { backgroundStyle, themeToCssVars } from "@/lib/theme";
import { absoluteUrl, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageParams {
  params: Promise<{ slug: string }>;
}

const FALLBACK_DESCRIPTION = "Fill in this form powered by Formcraft.";

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;

  try {
    const result = await getPublicFormBySlug(slug);
    if (!result) {
      return { title: "Form not found", description: FALLBACK_DESCRIPTION };
    }

    const title = result.form.title || "Untitled form";
    const description = truncate(
      result.form.description || FALLBACK_DESCRIPTION,
      160,
    );

    return {
      title,
      description,
      robots: { index: result.status === "published", follow: false },
      openGraph: {
        title,
        description,
        type: "website",
        url: absoluteUrl(`/f/${slug}`),
      },
    };
  } catch {
    // Metadata must never take the page down (e.g. a database hiccup).
    return { title: "Form", description: FALLBACK_DESCRIPTION };
  }
}

export default async function PublicFormPage({ params }: PageParams) {
  const { slug } = await params;
  const result = await getPublicFormBySlug(slug);
  if (!result) notFound();

  const { form, status, closedMessage } = result;

  if (status !== "published") {
    return (
      <main
        className="ncf-root grid min-h-dvh w-full place-items-center px-4 py-10 sm:px-6 sm:py-14"
        style={{ ...themeToCssVars(form.theme), ...backgroundStyle(form.theme) }}
        data-input-style={form.theme.inputStyle}
        data-button-style={form.theme.buttonStyle}
      >
        <div className="w-full">
          <div className="ncf-card">
            <div
              className="ncf-card-body"
              style={{
                textAlign: "center",
                paddingBlock: "clamp(32px, 7vw, 56px)",
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 18px",
                  background: "var(--ncf-primary-soft)",
                  color: "var(--ncf-primary)",
                }}
              >
                <Lock className="size-7" strokeWidth={2.25} />
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "0.78em",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ncf-muted)",
                }}
              >
                {form.title || "Untitled form"}
              </p>

              <h1 className="ncf-title" style={{ marginTop: 8 }}>
                This form is closed
              </h1>

              <p className="ncf-description" style={{ marginTop: 10 }}>
                {closedMessage || "This form is no longer accepting responses."}
              </p>
            </div>
          </div>

          <p className="ncf-footer-note">
            Built with <strong>Formcraft</strong>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh">
      <PublicFormClient form={form} />
    </main>
  );
}
