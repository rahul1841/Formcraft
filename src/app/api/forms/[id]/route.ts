import { requireApiUser } from "@/lib/auth";
import { getFormForOwner, isValidId } from "@/lib/data";
import { connectToDatabase } from "@/lib/db";
import { fail, handleApiError, ok } from "@/lib/http";
import { serializeForm } from "@/lib/serialize";
import { firstZodError, formUpdateSchema } from "@/lib/validation";
import FormModel from "@/models/Form";
import SubmissionModel from "@/models/Submission";
import type { z } from "zod";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };
type FormPatch = z.infer<typeof formUpdateSchema>;

const NOT_FOUND = "Form not found.";

/**
 * Nested theme/settings patches are written with dot paths so sending a single
 * key never resets the rest of the sub-document to its schema defaults.
 */
function buildSet(patch: FormPatch): Record<string, unknown> {
  const $set: Record<string, unknown> = {};

  if (patch.title !== undefined) $set.title = patch.title;
  if (patch.description !== undefined) $set.description = patch.description;
  if (patch.status !== undefined) $set.status = patch.status;
  if (patch.fields !== undefined) $set.fields = structuredClone(patch.fields);

  for (const [key, value] of Object.entries(patch.theme ?? {})) {
    if (value !== undefined) $set[`theme.${key}`] = value;
  }
  for (const [key, value] of Object.entries(patch.settings ?? {})) {
    if (value !== undefined) $set[`settings.${key}`] = value;
  }

  return $set;
}

/** GET /api/forms/:id — the full form, owner scoped. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail(NOT_FOUND, 404);

    const form = await getFormForOwner(user.id, id);
    if (!form) return fail(NOT_FOUND, 404);

    return ok({ form });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/forms/:id — partial update of any authored part of the form. */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail(NOT_FOUND, 404);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail("Send a JSON body with the changes to apply.", 400);
    }

    const parsed = formUpdateSchema.safeParse(body);
    if (!parsed.success) return fail(firstZodError(parsed.error), 400);

    const $set = buildSet(parsed.data);
    if (Object.keys($set).length === 0)
      return fail("There are no changes to save.", 400);

    await connectToDatabase();

    if (parsed.data.status === "published") {
      const current = await FormModel.findOne({ _id: id, ownerId: user.id })
        .select("publishedAt")
        .lean();
      if (!current) return fail(NOT_FOUND, 404);
      // Stamp the first publish only; re-publishing keeps the original date.
      if (!current.publishedAt) $set.publishedAt = new Date();
    }

    const doc = await FormModel.findOneAndUpdate(
      { _id: id, ownerId: user.id },
      { $set },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!doc) return fail(NOT_FOUND, 404);

    return ok({ form: serializeForm(doc) });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/forms/:id — removes the form and every response it collected. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail(NOT_FOUND, 404);

    await connectToDatabase();

    const doc = await FormModel.findOneAndDelete({
      _id: id,
      ownerId: user.id,
    }).lean();
    if (!doc) return fail(NOT_FOUND, 404);

    await SubmissionModel.deleteMany({ formId: id });

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
