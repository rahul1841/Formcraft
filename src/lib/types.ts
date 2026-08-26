/**
 * Shared domain types for the no-code form builder.
 * These types are the single source of truth for both client and server.
 */

/* -------------------------------------------------------------------------- */
/*                                   Fields                                    */
/* -------------------------------------------------------------------------- */

export const INPUT_FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "url",
  "date",
  "time",
  "select",
  "multiselect",
  "radio",
  "checkboxGroup",
  "checkbox",
  "rating",
  "range",
] as const;

export const STATIC_FIELD_TYPES = ["heading", "paragraph", "divider"] as const;

export const FIELD_TYPES = [...INPUT_FIELD_TYPES, ...STATIC_FIELD_TYPES] as const;

export type InputFieldType = (typeof INPUT_FIELD_TYPES)[number];
export type StaticFieldType = (typeof STATIC_FIELD_TYPES)[number];
export type FieldType = (typeof FIELD_TYPES)[number];

export type FieldWidth = "full" | "half" | "third";
export type Align = "left" | "center" | "right";

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  minSelected?: number;
  maxSelected?: number;
}

export interface FormField {
  /** Stable id used as the key in submission data. */
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  /** Layout width of the field inside the form grid. */
  width: FieldWidth;
  /** Horizontal alignment of the field's content. */
  align: Align;
  /** Choice options for select / multiselect / radio / checkboxGroup. */
  options?: FieldOption[];
  defaultValue?: string | string[] | number | boolean | null;
  validation?: FieldValidation;
  /** textarea only */
  rows?: number;
  /** rating only */
  maxRating?: number;
  /** range only */
  step?: number;
  /** heading / paragraph only */
  content?: string;
  /** heading only */
  headingLevel?: 1 | 2 | 3;
  /** checkbox (single consent) only */
  checkboxLabel?: string;
  /** select/multiselect/radio/checkboxGroup: render options side by side */
  optionLayout?: "vertical" | "horizontal" | "grid";
}

/* -------------------------------------------------------------------------- */
/*                                    Theme                                    */
/* -------------------------------------------------------------------------- */

export type InputStyle = "outlined" | "filled" | "underlined";
export type ButtonStyle = "solid" | "outline" | "soft";
export type Spacing = "compact" | "normal" | "relaxed";
export type FontSize = "sm" | "base" | "lg";
export type BackgroundPattern = "none" | "dots" | "grid" | "gradient";

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  /** CSS font-family stack. */
  fontFamily: string;
  fontSize: FontSize;
  /** Corner radius in px. */
  borderRadius: number;
  spacing: Spacing;
  inputStyle: InputStyle;
  buttonStyle: ButtonStyle;
  buttonAlign: Align | "full";
  labelAlign: Align;
  /** Max width of the form card in px. */
  maxWidth: number;
  showQuestionNumbers: boolean;
  backgroundPattern: BackgroundPattern;
  /** Optional image URL rendered at the top of the form card. */
  coverImageUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Settings                                   */
/* -------------------------------------------------------------------------- */

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  /** Optional URL the respondent is sent to after a successful submit. */
  redirectUrl?: string;
  showProgressBar: boolean;
  allowMultipleSubmissions: boolean;
  /** Stop accepting responses after this many submissions (0 = unlimited). */
  responseLimit: number;
  closedMessage: string;
}

/* -------------------------------------------------------------------------- */
/*                                    Form                                     */
/* -------------------------------------------------------------------------- */

export type FormStatus = "draft" | "published" | "closed";

export interface Form {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: FormStatus;
  fields: FormField[];
  theme: FormTheme;
  settings: FormSettings;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

/** The trimmed shape returned by the public endpoint (no counts / internals). */
export interface PublicForm {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: FormStatus;
  fields: FormField[];
  theme: FormTheme;
  settings: Pick<
    FormSettings,
    "submitButtonText" | "successMessage" | "redirectUrl" | "showProgressBar"
  >;
}

export interface FormSummary {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: FormStatus;
  fieldCount: number;
  responseCount: number;
  theme: Pick<FormTheme, "primaryColor" | "backgroundColor">;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Submissions                                 */
/* -------------------------------------------------------------------------- */

export type AnswerValue = string | string[] | number | boolean | null;

export interface FieldSnapshot {
  id: string;
  label: string;
  type: FieldType;
}

export interface Submission {
  id: string;
  formId: string;
  /** fieldId -> answer */
  data: Record<string, AnswerValue>;
  /** Field labels/types as they were when the response came in. */
  fieldSnapshot: FieldSnapshot[];
  submittedAt: string;
  meta: {
    userAgent?: string;
    ip?: string;
    /** Milliseconds the respondent spent on the form. */
    durationMs?: number;
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Analytics                                  */
/* -------------------------------------------------------------------------- */

export interface OptionCount {
  label: string;
  value: string;
  count: number;
  percentage: number;
}

export interface FieldAnalytics {
  fieldId: string;
  label: string;
  type: FieldType;
  answered: number;
  skipped: number;
  /** Choice-style fields. */
  options?: OptionCount[];
  /** Numeric / rating fields. */
  stats?: { average: number; min: number; max: number; median: number };
  /** Free-text fields: a handful of recent answers. */
  samples?: string[];
}

export interface FormAnalytics {
  formId: string;
  title: string;
  totalResponses: number;
  responsesToday: number;
  responsesThisWeek: number;
  averageCompletionSeconds: number | null;
  completionRate: number;
  timeline: { date: string; count: number }[];
  fields: FieldAnalytics[];
}

/* -------------------------------------------------------------------------- */
/*                                    User                                     */
/* -------------------------------------------------------------------------- */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/* -------------------------------------------------------------------------- */
/*                                API envelope                                 */
/* -------------------------------------------------------------------------- */

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: string;
  /** fieldId -> message, used for form validation errors. */
  fieldErrors?: Record<string, string>;
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
