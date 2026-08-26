import { getPublicFormBySlug } from "@/lib/data";
import { fail, handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";
// A form's status and content change from the builder, so this must never be cached.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** Public, unauthenticated read of a published form. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    if (!slug.trim()) return fail("Form not found.", 404);

    const result = await getPublicFormBySlug(slug.trim());
    if (!result) return fail("Form not found.", 404);

    if (result.status !== "published") {
      return fail(result.closedMessage, 403);
    }

    return ok({ form: result.form });
  } catch (err) {
    return handleApiError(err);
  }
}
