import { cookies } from "next/headers";
import { isAnswerable, LIMITS } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db";
import { clientIp, fail, handleApiError, ok } from "@/lib/http";
import { serializeForm } from "@/lib/serialize";
import { buildSearchText } from "@/lib/utils";
import { firstZodError, submitSchema, validateAnswers } from "@/lib/validation";
import FormModel from "@/models/Form";
import SubmissionModel from "@/models/Submission";
import type { AnswerValue, FieldSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** Longest a single choice value may be, and how many of them we accept. */
const MAX_ARRAY_ANSWERS = LIMITS.maxOptions;
const MAX_CHOICE_LENGTH = 200;

/** Defensive cap so an oversized answer can never bloat a document. */
function capAnswer(value: AnswerValue): AnswerValue {
  if (typeof value === "string") return value.slice(0, LIMITS.textAnswerMax);
  if (Array.isArray(value)) {
    // Bound the array too — an unauthenticated caller controls its length.
    return value
      .slice(0, MAX_ARRAY_ANSWERS)
      .map((entry) => entry.slice(0, MAX_CHOICE_LENGTH));
  }
  return value;
}

/** Cookie remembering that this browser already answered a given form. */
const submittedCookie = (formId: string) => `ncf_done_${formId}`;

/** Public, unauthenticated form submission. */
export async function POST(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    if (!slug.trim()) return fail("Form not found.", 404);

    await connectToDatabase();
    const doc = await FormModel.findOne({ slug: slug.trim() }).lean();
    if (!doc) return fail("Form not found.", 404);

    const form = serializeForm(doc);
    const { settings } = form;
    const formId = String(doc._id);

    if (form.status !== "published") return fail(settings.closedMessage, 403);

    const cookieStore = await cookies();
    if (
      !settings.allowMultipleSubmissions &&
      cookieStore.get(submittedCookie(formId))
    ) {
      return fail("You have already responded to this form.", 409);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return fail("We couldn't read that submission. Please try again.", 400);
    }

    const parsed = submitSchema.safeParse(payload);
    if (!parsed.success) return fail(firstZodError(parsed.error), 400);

    const { errors, cleaned } = validateAnswers(form.fields, parsed.data.data);
    if (Object.keys(errors).length > 0) {
      return fail("Please check the highlighted answers.", 400, errors);
    }

    const answers: Record<string, AnswerValue> = {};
    for (const [fieldId, value] of Object.entries(cleaned)) {
      answers[fieldId] = capAnswer(value);
    }

    const fieldSnapshot: FieldSnapshot[] = form.fields
      .filter((field) => isAnswerable(field.type))
      .map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
      }));

    // Claim a slot atomically: two simultaneous submissions can't both pass a
    // read-then-check against responseLimit, so the counter moves first and the
    // submission is only written once the slot is ours.
    const claimed = await FormModel.findOneAndUpdate(
      {
        _id: doc._id,
        status: "published",
        $or: [
          { "settings.responseLimit": { $lte: 0 } },
          {
            $expr: {
              $lt: ["$responseCount", "$settings.responseLimit"],
            },
          },
        ],
      },
      { $inc: { responseCount: 1 } },
      { returnDocument: "after" },
    ).lean();

    if (!claimed) return fail(settings.closedMessage, 403);

    let submission;
    try {
      submission = await SubmissionModel.create({
        formId: doc._id,
        ownerId: doc.ownerId,
        data: answers,
        fieldSnapshot,
        searchText: buildSearchText(form.fields, answers),
        submittedAt: new Date(),
        meta: {
          ip: clientIp(request) || undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          durationMs: parsed.data.durationMs,
        },
      });
    } catch (err) {
      // Give the slot back so a failed write doesn't permanently consume quota.
      await FormModel.updateOne(
        { _id: doc._id, responseCount: { $gt: 0 } },
        { $inc: { responseCount: -1 } },
      );
      throw err;
    }

    if (!settings.allowMultipleSubmissions) {
      cookieStore.set(submittedCookie(formId), "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    const redirect = settings.redirectUrl?.trim() ?? "";
    const redirectUrl = /^https?:\/\//i.test(redirect) ? redirect : null;

    return ok(
      {
        submissionId: String(submission._id),
        successMessage: settings.successMessage,
        redirectUrl,
      },
      201,
    );
  } catch (err) {
    return handleApiError(err);
  }
}
