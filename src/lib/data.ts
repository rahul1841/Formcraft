import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import FormModel from "@/models/Form";
import SubmissionModel from "@/models/Submission";
import {
  serializeForm,
  serializeFormSummary,
  serializePublicForm,
  serializeSubmission,
} from "@/lib/serialize";
import type { Form, FormSummary, PublicForm, Submission } from "@/lib/types";

export function isValidId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  responses: number;
}

export interface ListFormsOptions {
  search?: string;
  status?: string;
  sort?: "recent" | "created" | "title" | "responses";
}

export async function listForms(
  ownerId: string,
  options: ListFormsOptions = {},
): Promise<{ forms: FormSummary[]; stats: DashboardStats }> {
  await connectToDatabase();

  const query: Record<string, unknown> = { ownerId };
  if (options.status && options.status !== "all") query.status = options.status;
  if (options.search?.trim()) {
    const safe = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
    ];
  }

  const sortMap = {
    recent: { updatedAt: -1 },
    created: { createdAt: -1 },
    title: { title: 1 },
    responses: { responseCount: -1 },
  } as const;

  const [docs, all] = await Promise.all([
    FormModel.find(query)
      .sort(sortMap[options.sort ?? "recent"] as Record<string, 1 | -1>)
      .limit(200)
      .lean(),
    FormModel.find({ ownerId }).select("status responseCount").lean(),
  ]);

  const stats: DashboardStats = {
    total: all.length,
    published: all.filter((f) => f.status === "published").length,
    drafts: all.filter((f) => f.status === "draft").length,
    responses: all.reduce((sum, f) => sum + (f.responseCount ?? 0), 0),
  };

  return { forms: docs.map(serializeFormSummary), stats };
}

export async function getFormForOwner(
  ownerId: string,
  formId: string,
): Promise<Form | null> {
  if (!isValidId(formId)) return null;
  await connectToDatabase();
  const doc = await FormModel.findOne({ _id: formId, ownerId }).lean();
  return doc ? serializeForm(doc) : null;
}

export async function getPublicFormBySlug(
  slug: string,
): Promise<{ form: PublicForm; status: string; closedMessage: string } | null> {
  await connectToDatabase();
  const doc = await FormModel.findOne({ slug }).lean();
  if (!doc) return null;
  const full = serializeForm(doc);
  return {
    form: serializePublicForm(doc),
    status: full.status,
    closedMessage: full.settings.closedMessage,
  };
}

export interface SubmissionPage {
  submissions: Submission[];
  total: number;
  page: number;
  pages: number;
}

export async function listSubmissions(
  formId: string,
  options: { page?: number; limit?: number; search?: string } = {},
): Promise<SubmissionPage> {
  await connectToDatabase();
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 200);
  const page = Math.max(options.page ?? 1, 1);

  const query: Record<string, unknown> = { formId };
  if (options.search?.trim()) {
    const safe = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // `data` is a Mixed sub-document, which MongoDB cannot regex-match; every
    // submission carries a flattened `searchText` copy of its answers instead.
    query.searchText = { $regex: safe, $options: "i" };
  }

  const [docs, total] = await Promise.all([
    SubmissionModel.find(query)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SubmissionModel.countDocuments(query),
  ]);

  return {
    submissions: docs.map(serializeSubmission),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Every submission for a form — used by analytics and exports. */
export async function allSubmissions(formId: string): Promise<Submission[]> {
  await connectToDatabase();
  const docs = await SubmissionModel.find({ formId })
    .sort({ submittedAt: -1 })
    .limit(50000)
    .lean();
  return docs.map(serializeSubmission);
}
