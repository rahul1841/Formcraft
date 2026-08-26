import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SnapshotSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "" },
    type: { type: String, default: "text" },
  },
  { _id: false },
);

const SubmissionSchema = new Schema(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    /** fieldId -> answer value */
    data: { type: Schema.Types.Mixed, default: {} },
    /** Field labels/types captured at submission time. */
    fieldSnapshot: { type: [SnapshotSchema], default: [] },
    /** All answers flattened to text so the admin can search responses. */
    searchText: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now, index: true },
    meta: {
      userAgent: String,
      ip: String,
      durationMs: Number,
    },
  },
  { timestamps: false },
);

SubmissionSchema.index({ formId: 1, submittedAt: -1 });
SubmissionSchema.index({ formId: 1, searchText: 1 });

export type SubmissionDoc = InferSchemaType<typeof SubmissionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SubmissionModel: Model<SubmissionDoc> =
  (mongoose.models.Submission as Model<SubmissionDoc>) ||
  mongoose.model<SubmissionDoc>("Submission", SubmissionSchema);

export default SubmissionModel;
