import type {
  FieldType,
  FormField,
  FormSettings,
  FormTheme,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*                                   Fonts                                     */
/* -------------------------------------------------------------------------- */

export interface FontOption {
  id: string;
  name: string;
  stack: string;
  category: "Sans" | "Serif" | "Mono";
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "inter",
    name: "Inter",
    stack: "var(--font-inter), system-ui, -apple-system, sans-serif",
    category: "Sans",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    stack: "var(--font-dm-sans), system-ui, -apple-system, sans-serif",
    category: "Sans",
  },
  {
    id: "poppins",
    name: "Poppins",
    stack: "var(--font-poppins), system-ui, -apple-system, sans-serif",
    category: "Sans",
  },
  {
    id: "system",
    name: "System UI",
    stack:
      "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    category: "Sans",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    stack: "var(--font-playfair), Georgia, 'Times New Roman', serif",
    category: "Serif",
  },
  {
    id: "lora",
    name: "Lora",
    stack: "var(--font-lora), Georgia, 'Times New Roman', serif",
    category: "Serif",
  },
  {
    id: "georgia",
    name: "Georgia",
    stack: "Georgia, 'Times New Roman', serif",
    category: "Serif",
  },
  {
    id: "jetbrains",
    name: "JetBrains Mono",
    stack: "var(--font-jetbrains), 'SF Mono', Menlo, monospace",
    category: "Mono",
  },
];

export const DEFAULT_FONT_STACK = FONT_OPTIONS[0].stack;

/* -------------------------------------------------------------------------- */
/*                              Theme + settings                               */
/* -------------------------------------------------------------------------- */

export const DEFAULT_THEME: FormTheme = {
  primaryColor: "#4f46e5",
  backgroundColor: "#f1f5f9",
  cardBackground: "#ffffff",
  textColor: "#0f172a",
  mutedTextColor: "#64748b",
  borderColor: "#e2e8f0",
  fontFamily: DEFAULT_FONT_STACK,
  fontSize: "base",
  borderRadius: 12,
  spacing: "normal",
  inputStyle: "outlined",
  buttonStyle: "solid",
  buttonAlign: "full",
  labelAlign: "left",
  maxWidth: 720,
  showQuestionNumbers: false,
  backgroundPattern: "none",
  coverImageUrl: "",
};

export const DEFAULT_SETTINGS: FormSettings = {
  submitButtonText: "Submit",
  successMessage: "Thanks! Your response has been recorded.",
  redirectUrl: "",
  showProgressBar: true,
  allowMultipleSubmissions: true,
  responseLimit: 0,
  closedMessage: "This form is no longer accepting responses.",
};

export interface ThemePreset {
  id: string;
  name: string;
  theme: Partial<FormTheme>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "indigo",
    name: "Indigo",
    theme: {
      primaryColor: "#4f46e5",
      backgroundColor: "#f1f5f9",
      cardBackground: "#ffffff",
      textColor: "#0f172a",
      mutedTextColor: "#64748b",
      borderColor: "#e2e8f0",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    theme: {
      primaryColor: "#059669",
      backgroundColor: "#ecfdf5",
      cardBackground: "#ffffff",
      textColor: "#052e16",
      mutedTextColor: "#4b7a63",
      borderColor: "#d1fae5",
    },
  },
  {
    id: "rose",
    name: "Rose",
    theme: {
      primaryColor: "#e11d48",
      backgroundColor: "#fff1f2",
      cardBackground: "#ffffff",
      textColor: "#4c0519",
      mutedTextColor: "#9f6070",
      borderColor: "#fecdd3",
    },
  },
  {
    id: "amber",
    name: "Amber",
    theme: {
      primaryColor: "#d97706",
      backgroundColor: "#fffbeb",
      cardBackground: "#ffffff",
      textColor: "#451a03",
      mutedTextColor: "#8a6d3b",
      borderColor: "#fde68a",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    theme: {
      primaryColor: "#0284c7",
      backgroundColor: "#f0f9ff",
      cardBackground: "#ffffff",
      textColor: "#082f49",
      mutedTextColor: "#5b7f96",
      borderColor: "#bae6fd",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    theme: {
      primaryColor: "#818cf8",
      backgroundColor: "#0b1120",
      cardBackground: "#111827",
      textColor: "#e5e7eb",
      mutedTextColor: "#9ca3af",
      borderColor: "#1f2937",
    },
  },
  {
    id: "graphite",
    name: "Graphite",
    theme: {
      primaryColor: "#111827",
      backgroundColor: "#f8fafc",
      cardBackground: "#ffffff",
      textColor: "#111827",
      mutedTextColor: "#6b7280",
      borderColor: "#e5e7eb",
    },
  },
  {
    id: "violet",
    name: "Violet",
    theme: {
      primaryColor: "#7c3aed",
      backgroundColor: "#faf5ff",
      cardBackground: "#ffffff",
      textColor: "#2e1065",
      mutedTextColor: "#7e6b96",
      borderColor: "#e9d5ff",
    },
  },
];

export const COLOR_SWATCHES = [
  "#4f46e5",
  "#2563eb",
  "#0284c7",
  "#0d9488",
  "#059669",
  "#65a30d",
  "#d97706",
  "#ea580c",
  "#dc2626",
  "#e11d48",
  "#db2777",
  "#7c3aed",
  "#111827",
  "#475569",
  "#94a3b8",
  "#ffffff",
];

/* -------------------------------------------------------------------------- */
/*                              Field definitions                              */
/* -------------------------------------------------------------------------- */

export type FieldGroup = "Basic" | "Choice" | "Advanced" | "Layout";

export interface FieldMeta {
  type: FieldType;
  name: string;
  description: string;
  group: FieldGroup;
  /** Applied on top of the base field when a new field is created. */
  defaults: Partial<FormField>;
}

export const FIELD_META: Record<FieldType, FieldMeta> = {
  text: {
    type: "text",
    name: "Short text",
    description: "Single line answer",
    group: "Basic",
    defaults: { label: "Short answer", placeholder: "Type your answer" },
  },
  textarea: {
    type: "textarea",
    name: "Long text",
    description: "Multi-line paragraph",
    group: "Basic",
    defaults: {
      label: "Long answer",
      placeholder: "Type your answer",
      rows: 4,
    },
  },
  email: {
    type: "email",
    name: "Email",
    description: "Validated email address",
    group: "Basic",
    defaults: { label: "Email address", placeholder: "you@example.com" },
  },
  phone: {
    type: "phone",
    name: "Phone",
    description: "Telephone number",
    group: "Basic",
    defaults: { label: "Phone number", placeholder: "+1 555 000 1234" },
  },
  number: {
    type: "number",
    name: "Number",
    description: "Numeric input",
    group: "Basic",
    defaults: { label: "Number", placeholder: "0" },
  },
  url: {
    type: "url",
    name: "Website",
    description: "URL input",
    group: "Basic",
    defaults: { label: "Website", placeholder: "https://example.com" },
  },
  date: {
    type: "date",
    name: "Date",
    description: "Date picker",
    group: "Basic",
    defaults: { label: "Date" },
  },
  time: {
    type: "time",
    name: "Time",
    description: "Time picker",
    group: "Basic",
    defaults: { label: "Time" },
  },
  select: {
    type: "select",
    name: "Dropdown",
    description: "Pick one from a list",
    group: "Choice",
    defaults: { label: "Dropdown", placeholder: "Select an option" },
  },
  multiselect: {
    type: "multiselect",
    name: "Multi-select",
    description: "Pick several from a list",
    group: "Choice",
    defaults: { label: "Multi-select", placeholder: "Select options" },
  },
  radio: {
    type: "radio",
    name: "Radio buttons",
    description: "Pick exactly one",
    group: "Choice",
    defaults: { label: "Choose one", optionLayout: "vertical" },
  },
  checkboxGroup: {
    type: "checkboxGroup",
    name: "Checkboxes",
    description: "Pick any number",
    group: "Choice",
    defaults: { label: "Choose all that apply", optionLayout: "vertical" },
  },
  checkbox: {
    type: "checkbox",
    name: "Single checkbox",
    description: "Consent / agreement toggle",
    group: "Choice",
    defaults: {
      label: "Agreement",
      checkboxLabel: "I agree to the terms and conditions",
    },
  },
  rating: {
    type: "rating",
    name: "Star rating",
    description: "Rate on a star scale",
    group: "Advanced",
    defaults: { label: "How would you rate us?", maxRating: 5 },
  },
  range: {
    type: "range",
    name: "Slider",
    description: "Pick a value on a scale",
    group: "Advanced",
    defaults: {
      label: "Slider",
      validation: { min: 0, max: 100 },
      step: 1,
      defaultValue: 50,
    },
  },
  heading: {
    type: "heading",
    name: "Heading",
    description: "Section title",
    group: "Layout",
    defaults: { label: "Heading", content: "Section heading", headingLevel: 2 },
  },
  paragraph: {
    type: "paragraph",
    name: "Paragraph",
    description: "Static helper text",
    group: "Layout",
    defaults: {
      label: "Paragraph",
      content: "Add a short description or instructions here.",
    },
  },
  divider: {
    type: "divider",
    name: "Divider",
    description: "Horizontal rule",
    group: "Layout",
    defaults: { label: "Divider" },
  },
};

export const FIELD_GROUPS: { group: FieldGroup; types: FieldType[] }[] = [
  {
    group: "Basic",
    types: [
      "text",
      "textarea",
      "email",
      "phone",
      "number",
      "url",
      "date",
      "time",
    ],
  },
  {
    group: "Choice",
    types: ["select", "multiselect", "radio", "checkboxGroup", "checkbox"],
  },
  { group: "Advanced", types: ["rating", "range"] },
  { group: "Layout", types: ["heading", "paragraph", "divider"] },
];

/** Field types that collect an answer from the respondent. */
export const ANSWERABLE_TYPES: FieldType[] = [
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
];

/** Field types backed by a list of options. */
export const OPTION_TYPES: FieldType[] = [
  "select",
  "multiselect",
  "radio",
  "checkboxGroup",
];

export function isAnswerable(type: FieldType): boolean {
  return ANSWERABLE_TYPES.includes(type);
}

export function hasOptions(type: FieldType): boolean {
  return OPTION_TYPES.includes(type);
}

/* -------------------------------------------------------------------------- */
/*                                 Misc limits                                 */
/* -------------------------------------------------------------------------- */

export const LIMITS = {
  titleMax: 160,
  descriptionMax: 1000,
  labelMax: 300,
  optionLabelMax: 200,
  textAnswerMax: 10000,
  maxFields: 200,
  maxOptions: 100,
};

export const SPACING_SCALE: Record<FormTheme["spacing"], number> = {
  compact: 14,
  normal: 22,
  relaxed: 32,
};

export const FONT_SIZE_SCALE: Record<FormTheme["fontSize"], number> = {
  sm: 14,
  base: 16,
  lg: 18,
};
