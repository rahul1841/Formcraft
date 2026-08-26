import { requireApiUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getFormForOwner, isValidId, listSubmissions } from "@/lib/data";
import { fail, handleApiError, ok } from "@/lib/http";
import FormModel from "@/models/Form";
import SubmissionModel from "@/models/Submission";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function toPositiveInt(raw: string | null, fallback: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Paginated responses for one form. */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail("Form not found.", 404);

    const form = await getFormForOwner(user.id, id);
    if (!form) return fail("Form not found.", 404);

    const searchParams = new URL(request.url).searchParams;
    const page = toPositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(toPositiveInt(searchParams.get("limit"), 25), 200);
    const search = searchParams.get("search")?.trim() || undefined;

    const result = await listSubmissions(id, { page, limit, search });
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}

/** Clear every response for a form. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail("Form not found.", 404);

    const form = await getFormForOwner(user.id, id);
    if (!form) return fail("Form not found.", 404);

    await connectToDatabase();
    const result = await SubmissionModel.deleteMany({ formId: id });
    await FormModel.updateOne({ _id: id }, { $set: { responseCount: 0 } });

    return ok({ deleted: result.deletedCount ?? 0 });
  } catch (err) {
    return handleApiError(err);
  }
}
