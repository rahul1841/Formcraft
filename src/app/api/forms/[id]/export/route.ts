import { requireApiUser } from "@/lib/auth";
import { allSubmissions, getFormForOwner, isValidId } from "@/lib/data";
import { fail, handleApiError } from "@/lib/http";
import { submissionsToCsv } from "@/lib/utils";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const FORMATS = ["csv", "json"] as const;
type ExportFormat = (typeof FORMATS)[number];

function isExportFormat(value: string): value is ExportFormat {
  return (FORMATS as readonly string[]).includes(value);
}

/** Keeps the slug safe to embed in a Content-Disposition header. */
function safeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "form";
}

/** Download every response as a CSV or JSON file (not the ok() envelope). */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail("Form not found.", 404);

    const format = new URL(request.url).searchParams.get("format") ?? "csv";
    if (!isExportFormat(format)) {
      return fail("Unsupported export format. Use csv or json.", 400);
    }

    const form = await getFormForOwner(user.id, id);
    if (!form) return fail("Form not found.", 404);

    const submissions = await allSubmissions(id);
    const exportedAt = new Date();
    const filename = `${safeSlug(form.slug)}-responses-${exportedAt
      .toISOString()
      .slice(0, 10)}.${format}`;

    const body =
      format === "csv"
        ? // BOM so Excel reads the file as UTF-8 rather than the system codepage.
          `\uFEFF${submissionsToCsv(form.fields, submissions)}`
        : JSON.stringify(
            {
              form: { id: form.id, title: form.title, slug: form.slug },
              exportedAt: exportedAt.toISOString(),
              count: submissions.length,
              submissions,
            },
            null,
            2,
          );

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type":
          format === "csv"
            ? "text/csv; charset=utf-8"
            : "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
