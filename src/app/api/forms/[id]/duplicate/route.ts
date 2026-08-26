import { requireApiUser } from "@/lib/auth";
import { getFormForOwner, isValidId } from "@/lib/data";
import { connectToDatabase } from "@/lib/db";
import { makeSlug } from "@/lib/fields";
import { LIMITS } from "@/lib/constants";
import { fail, handleApiError, ok } from "@/lib/http";
import { serializeForm } from "@/lib/serialize";
import FormModel from "@/models/Form";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const COPY_SUFFIX = " (copy)";

function copyTitle(title: string): string {
  const room = LIMITS.titleMax - COPY_SUFFIX.length;
  const base = title.length > room ? `${title.slice(0, room - 1).trimEnd()}…` : title;
  return `${base}${COPY_SUFFIX}`;
}

function isDuplicateSlugError(err: unknown): boolean {
  const code = (err as { code?: number } | null)?.code;
  return code === 11000 || (err instanceof Error && /E11000/.test(err.message));
}

/** POST /api/forms/:id/duplicate — a fresh draft copy; responses are not copied. */
export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail("Form not found.", 404);

    const source = await getFormForOwner(user.id, id);
    if (!source) return fail("Form not found.", 404);

    const title = copyTitle(source.title);
    const draft = {
      title,
      description: source.description,
      status: "draft" as const,
      // Cloned so the copy never shares field/theme objects with the original.
      fields: structuredClone(source.fields),
      theme: structuredClone(source.theme),
      settings: structuredClone(source.settings),
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
