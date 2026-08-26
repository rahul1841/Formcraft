import { requireApiUser } from "@/lib/auth";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/lib/constants";
import { listForms, type ListFormsOptions } from "@/lib/data";
import { connectToDatabase } from "@/lib/db";
import { makeSlug } from "@/lib/fields";
import { fail, handleApiError, ok } from "@/lib/http";
import { serializeForm } from "@/lib/serialize";
import { getTemplate } from "@/lib/templates";
import { firstZodError, formCreateSchema } from "@/lib/validation";
import FormModel from "@/models/Form";

export const runtime = "nodejs";

const SORT_OPTIONS = ["recent", "created", "title", "responses"] as const;
const STATUS_OPTIONS = ["all", "draft", "published", "closed"] as const;

type SortOption = (typeof SORT_OPTIONS)[number];
type StatusOption = (typeof STATUS_OPTIONS)[number];

function readSort(value: string | null): SortOption | undefined {
  return SORT_OPTIONS.includes(value as SortOption)
    ? (value as SortOption)
    : undefined;
}

function readStatus(value: string | null): StatusOption | undefined {
  return STATUS_OPTIONS.includes(value as StatusOption)
    ? (value as StatusOption)
    : undefined;
}

/** A POST with no body (or a malformed one) is treated as an empty payload. */
async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function isDuplicateSlugError(err: unknown): boolean {
  const code = (err as { code?: number } | null)?.code;
  return code === 11000 || (err instanceof Error && /E11000/.test(err.message));
}

/** GET /api/forms — the dashboard list plus its headline counters. */
export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);

    const options: ListFormsOptions = {
      search: searchParams.get("search")?.trim() || undefined,
      status: readStatus(searchParams.get("status")),
      sort: readSort(searchParams.get("sort")),
    };

    return ok(await listForms(user.id, options));
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/forms — create a form, optionally seeded from a template. */
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();

    const parsed = formCreateSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return fail(firstZodError(parsed.error), 400);

    const templateId = parsed.data.templateId?.trim() || "blank";
    const template = getTemplate(templateId);
    if (!template) return fail("That template doesn't exist.", 400);

    const title = parsed.data.title?.trim() || template.title;
    const draft = {
      title,
      description: template.formDescription,
      status: "draft" as const,
      // Cloned so the new document never shares references with the template.
      fields: structuredClone(template.build()),
      theme: { ...DEFAULT_THEME, ...structuredClone(template.theme ?? {}) },
      settings: { ...DEFAULT_SETTINGS },
      ownerId: user.id,
      responseCount: 0,
      publishedAt: null,
    };

    await connectToDatabase();

    let doc;
    try {
      doc = await FormModel.create({ ...draft, slug: makeSlug(title) });
    } catch (err) {
      // The slug carries a random suffix, so a collision means retrying once is enough.
      if (!isDuplicateSlugError(err)) throw err;
      doc = await FormModel.create({ ...draft, slug: makeSlug(title) });
    }

    return ok({ form: serializeForm(doc.toObject()) }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
