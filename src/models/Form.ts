import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { FIELD_TYPES } from "@/lib/types";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/lib/constants";

const OptionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  { _id: false },
);

const ValidationSchema = new Schema(
  {
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String,
    patternMessage: String,
    minSelected: Number,
    maxSelected: Number,
  },
  { _id: false },
);

const FieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, enum: FIELD_TYPES as unknown as string[] },
    label: { type: String, default: "" },
    placeholder: String,
    helpText: String,
    required: { type: Boolean, default: false },
    width: { type: String, enum: ["full", "half", "third"], default: "full" },
    align: { type: String, enum: ["left", "center", "right"], default: "left" },
    options: { type: [OptionSchema], default: undefined },
    defaultValue: Schema.Types.Mixed,
    validation: { type: ValidationSchema, default: undefined },
    rows: Number,
    maxRating: Number,
    step: Number,
    content: String,
    headingLevel: Number,
    checkboxLabel: String,
    optionLayout: {
      type: String,
      enum: ["vertical", "horizontal", "grid"],
      default: undefined,
    },
  },
  { _id: false },
);

const ThemeSchema = new Schema(
  {
    primaryColor: { type: String, default: DEFAULT_THEME.primaryColor },
    backgroundColor: { type: String, default: DEFAULT_THEME.backgroundColor },
    cardBackground: { type: String, default: DEFAULT_THEME.cardBackground },
    textColor: { type: String, default: DEFAULT_THEME.textColor },
    mutedTextColor: { type: String, default: DEFAULT_THEME.mutedTextColor },
    borderColor: { type: String, default: DEFAULT_THEME.borderColor },
    fontFamily: { type: String, default: DEFAULT_THEME.fontFamily },
    fontSize: { type: String, enum: ["sm", "base", "lg"], default: "base" },
    borderRadius: { type: Number, default: DEFAULT_THEME.borderRadius },
    spacing: {
      type: String,
      enum: ["compact", "normal", "relaxed"],
      default: "normal",
    },
    inputStyle: {
      type: String,
      enum: ["outlined", "filled", "underlined"],
      default: "outlined",
    },
    buttonStyle: {
      type: String,
      enum: ["solid", "outline", "soft"],
      default: "solid",
    },
    buttonAlign: {
      type: String,
      enum: ["left", "center", "right", "full"],
      default: "full",
    },
    labelAlign: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
    },
    maxWidth: { type: Number, default: DEFAULT_THEME.maxWidth },
    showQuestionNumbers: { type: Boolean, default: false },
    backgroundPattern: {
      type: String,
      enum: ["none", "dots", "grid", "gradient"],
      default: "none",
    },
    coverImageUrl: { type: String, default: "" },
  },
  { _id: false },
);

const SettingsSchema = new Schema(
  {
    submitButtonText: {
      type: String,
      default: DEFAULT_SETTINGS.submitButtonText,
    },
    successMessage: { type: String, default: DEFAULT_SETTINGS.successMessage },
    redirectUrl: { type: String, default: "" },
    showProgressBar: { type: Boolean, default: true },
    allowMultipleSubmissions: { type: Boolean, default: true },
    responseLimit: { type: Number, default: 0 },
    closedMessage: { type: String, default: DEFAULT_SETTINGS.closedMessage },
  },
  { _id: false },
);

const FormSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, default: "Untitled form" },
    description: { type: String, default: "" },
    slug: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
      index: true,
    },
    fields: { type: [FieldSchema], default: [] },
    theme: { type: ThemeSchema, default: () => ({}) },
    settings: { type: SettingsSchema, default: () => ({}) },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    responseCount: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

FormSchema.index({ ownerId: 1, updatedAt: -1 });

export type FormDoc = InferSchemaType<typeof FormSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const FormModel: Model<FormDoc> =
  (mongoose.models.Form as Model<FormDoc>) ||
  mongoose.model<FormDoc>("Form", FormSchema);

export default FormModel;
