import { endSession } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";

export const runtime = "nodejs";

async function signOut() {
  try {
    await endSession();
    return ok({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST() {
  return signOut();
}

/** Same behaviour over GET so a plain <a href="/api/auth/logout"> works. */
export async function GET() {
  return signOut();
}
