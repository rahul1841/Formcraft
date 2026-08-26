import { requireApiUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getFormForOwner, isValidId } from "@/lib/data";
import { fail, handleApiError, ok } from "@/lib/http";
import FormModel from "@/models/Form";
import SubmissionModel from "@/models/Submission";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; responseId: string }> };

/** Delete a single response. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { id, responseId } = await params;
    if (!isValidId(id)) return fail("Form not found.", 404);
    if (!isValidId(responseId)) return fail("Response not found.", 404);

    const form = await getFormForOwner(user.id, id);
    if (!form) return fail("Form not found.", 404);

    await connectToDatabase();
    const result = await SubmissionModel.deleteOne({
      _id: responseId,
      formId: id,
    });
    if (!result.deletedCount) return fail("Response not found.", 404);

    // Guarded so a drifted counter can never go negative.
    await FormModel.updateOne(
      { _id: id, responseCount: { $gt: 0 } },
      { $inc: { responseCount: -1 } },
    );

    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
