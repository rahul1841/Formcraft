import { getSessionUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    return user ? ok({ user }) : fail("Not signed in.", 401);
  } catch (err) {
    return handleApiError(err);
  }
}
