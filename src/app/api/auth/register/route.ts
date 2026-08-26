import { connectToDatabase } from "@/lib/db";
import { hashPassword, startSession } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { firstZodError, registerSchema } from "@/lib/validation";
import { User } from "@/models/User";
import type { AuthUser } from "@/lib/types";

export const runtime = "nodejs";

const EMAIL_TAKEN = "An account with that email already exists.";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return fail(firstZodError(parsed.error), 400);

    const { name, email, password } = parsed.data;

    await connectToDatabase();

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) return fail(EMAIL_TAKEN, 409);

    const passwordHash = await hashPassword(password);

    let created;
    try {
      created = await User.create({ name, email, passwordHash });
    } catch (err) {
      // Two sign-ups for the same address can race past the check above; the
      // unique index is the real guard, so translate it to the same message.
      if (err instanceof Error && /E11000/.test(err.message)) {
        return fail(EMAIL_TAKEN, 409);
      }
      throw err;
    }

    const user: AuthUser = {
      id: String(created._id),
      email: created.email,
      name: created.name,
    };

    await startSession(user);
    return ok({ user }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
