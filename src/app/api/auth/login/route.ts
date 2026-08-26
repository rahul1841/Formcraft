import { connectToDatabase } from "@/lib/db";
import { startSession, verifyPassword } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { credentialsSchema, firstZodError } from "@/lib/validation";
import { User } from "@/models/User";
import type { AuthUser } from "@/lib/types";

export const runtime = "nodejs";

/** One message for every failure so the endpoint never reveals which emails exist. */
const INVALID_CREDENTIALS = "Incorrect email or password.";

/**
 * A real bcrypt hash of a throwaway string. When no account matches we still run
 * a comparison against it, so a missing user and a wrong password take the same
 * amount of time and cannot be told apart by timing.
 */
const DUMMY_HASH = "$2b$10$paun.H2atkww8RIMQ4FqTu9i8pbZ2toaMrhyCo8Ee1P5BFLnb2HJi";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) return fail(firstZodError(parsed.error), 400);

    const { email, password } = parsed.data;

    await connectToDatabase();

    // The schema and the model both lower-case addresses; the collation makes the
    // lookup case-insensitive for any document that predates that normalisation.
    const account = await User.findOne({ email })
      .collation({ locale: "en", strength: 2 })
      .lean();

    const matches = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH);
    if (!account || !matches) return fail(INVALID_CREDENTIALS, 401);

    const user: AuthUser = {
      id: String(account._id),
      email: account.email,
      name: account.name,
    };

    await startSession(user);
    return ok({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
