import { computeAnalytics } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { allSubmissions, getFormForOwner, isValidId } from "@/lib/data";
import { fail, handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Aggregated stats for the responses dashboard. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    if (!isValidId(id)) return fail("Form not found.", 404);

    const form = await getFormForOwner(user.id, id);
    if (!form) return fail("Form not found.", 404);

    const submissions = await allSubmissions(id);
    return ok({ analytics: computeAnalytics(form, submissions) });
  } catch (err) {
    return handleApiError(err);
  }
}
