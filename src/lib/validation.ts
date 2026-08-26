import { z } from "zod";
import { FIELD_TYPES } from "@/lib/types";
import { LIMITS, hasOptions, isAnswerable } from "@/lib/constants";
import type { AnswerValue, FormField } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*                              Request payloads                               */
/* -------------------------------------------------------------------------- */

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
});

const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(LIMITS.optionLabelMax).default(""),
  value: z.string().max(LIMITS.optionLabelMax).default(""),
});

const fieldValidationSchema = z
  .object({
    minLength: z.number().int().min(0).max(100000).optional(),
    maxLength: z.number().int().min(0).max(100000).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().max(200).optional(),
    patternMessage: z.string().max(300).optional(),
    minSelected: z.number().int().min(0).max(1000).optional(),
    maxSelected: z.number().int().min(0).max(1000).optional(),
  })
  .partial();

export const fieldSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(FIELD_TYPES),
  label: z.string().max(LIMITS.labelMax).default(""),
  placeholder: z.string().max(300).optional(),
  helpText: z.string().max(600).optional(),
  required: z.boolean().default(false),
  width: z.enum(["full", "half", "third"]).default("full"),
  align: z.enum(["left", "center", "right"]).default("left"),
  options: z.array(optionSchema).max(LIMITS.maxOptions).optional(),
  defaultValue: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()])
    .optional(),
  validation: fieldValidationSchema.optional(),
  rows: z.number().int().min(2).max(30).optional(),
  maxRating: z.number().int().min(3).max(10).optional(),
  step: z.number().min(0.001).max(1000).optional(),
  content: z.string().max(3000).optional(),
  headingLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  checkboxLabel: z.string().max(600).optional(),
  optionLayout: z.enum(["vertical", "horizontal", "grid"]).optional(),
});

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Use a hex colour like #4f46e5");

export const themeSchema = z
  .object({
    primaryColor: hexColor,
    backgroundColor: hexColor,
    cardBackground: hexColor,
    textColor: hexColor,
    mutedTextColor: hexColor,
    borderColor: hexColor,
    fontFamily: z.string().max(200),
    fontSize: z.enum(["sm", "base", "lg"]),
    borderRadius: z.number().min(0).max(48),
    spacing: z.enum(["compact", "normal", "relaxed"]),
    inputStyle: z.enum(["outlined", "filled", "underlined"]),
    buttonStyle: z.enum(["solid", "outline", "soft"]),
    buttonAlign: z.enum(["left", "center", "right", "full"]),
    labelAlign: z.enum(["left", "center", "right"]),
    maxWidth: z.number().min(360).max(1200),
    showQuestionNumbers: z.boolean(),
    backgroundPattern: z.enum(["none", "dots", "grid", "gradient"]),
    coverImageUrl: z.string().max(2000).optional(),
  })
  .partial();

export const settingsSchema = z
  .object({
    submitButtonText: z.string().trim().min(1).max(60),
    successMessage: z.string().max(2000),
    redirectUrl: z
      .string()
      .max(2000)
      .refine(
        (value) => value.trim() === "" || /^https?:\/\//i.test(value.trim()),
        "The redirect URL must start with http:// or https://",
      ),
    showProgressBar: z.boolean(),
    allowMultipleSubmissions: z.boolean(),
    responseLimit: z.number().int().min(0).max(1000000),
    closedMessage: z.string().max(2000),
  })
  .partial();

export const formUpdateSchema = z
  .object({
    title: z.string().trim().min(1, "Give your form a title.").max(LIMITS.titleMax),
    description: z.string().max(LIMITS.descriptionMax),
    status: z.enum(["draft", "published", "closed"]),
    fields: z.array(fieldSchema).max(LIMITS.maxFields),
    theme: themeSchema,
    settings: settingsSchema,
  })
  .partial();

export const formCreateSchema = z.object({
  title: z.string().trim().min(1).max(LIMITS.titleMax).optional(),
  templateId: z.string().max(40).optional(),
});

export const submitSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  durationMs: z.number().int().min(0).max(1000 * 60 * 60 * 24).optional(),
});

/* -------------------------------------------------------------------------- */
/*                             Answer validation                               */
/* -------------------------------------------------------------------------- */

/**
 * A form author writes `validation.pattern`, and it is executed on the public
 * submit route against respondent input — so a catastrophically backtracking
 * pattern would be an unauthenticated CPU denial of service. Node offers no
 * regex timeout, so we refuse the shapes that cause it and cap the input we test.
 */
const MAX_PATTERN_INPUT = 512;
const MAX_PATTERN_LENGTH = 200;

/**
 * True when a pattern contains a quantified group whose body itself contains a
 * quantifier or an alternation — the `(a+)+` / `(a|aa)+` family behind almost
 * every catastrophic-backtracking case. Deliberately conservative: a pattern we
 * refuse simply isn't enforced, which can never block a respondent.
 */
export function isRiskyPattern(source: string): boolean {
  if (source.length > MAX_PATTERN_LENGTH) return true;
  // A doubly-quantified character class, e.g. [a-z]+*
  if (/\][*+?]{2,}/.test(source)) return true;

  const open: number[] = [];
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === "\\") {
      i++;
    } else if (char === "[") {
      // Skip the character class wholesale; its contents cannot nest a group.
      i++;
      while (i < source.length && source[i] !== "]") {
        if (source[i] === "\\") i++;
        i++;
      }
    } else if (char === "(") {
      open.push(i);
    } else if (char === ")") {
      const start = open.pop();
      if (start === undefined) continue;
      const quantifier = source[i + 1];
      if (quantifier === "*" || quantifier === "+" || quantifier === "{") {
        if (/[*+{|]/.test(source.slice(start + 1, i))) return true;
      }
    }
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^[+]?[\d][\d\s().-]{5,24}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

export function isEmptyAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return value === false;
  return false;
}

/** Coerce a raw answer into the canonical shape for its field type. */
export function coerceAnswer(field: FormField, raw: unknown): AnswerValue {
  switch (field.type) {
    case "number":
    case "range":
    case "rating": {
      if (raw === "" || raw === null || raw === undefined) return null;
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    case "checkbox":
      return raw === true || raw === "true" || raw === "on";
    case "multiselect":
    case "checkboxGroup": {
      if (Array.isArray(raw)) return raw.map((v) => String(v));
      if (raw === null || raw === undefined || raw === "") return [];
      return [String(raw)];
    }
    default:
      if (raw === null || raw === undefined) return "";
      if (Array.isArray(raw)) return raw.map(String).join(", ");
      return String(raw);
  }
}

/**
 * Validate a single answer. Returns an error message, or null when valid.
 * Shared by the client renderer (live validation) and the submit endpoint.
 */
export function validateAnswer(field: FormField, raw: unknown): string | null {
  if (!isAnswerable(field.type)) return null;

  const value = coerceAnswer(field, raw);
  const empty = isEmptyAnswer(value);
  const label = field.label?.trim() || "This field";

  if (field.required && empty) {
    if (field.type === "checkbox") return "Please tick this box to continue.";
    if (hasOptions(field.type) || field.type === "select")
      return "Please choose an option.";
    return `${label} is required.`;
  }
  if (empty) return null;

  const v = field.validation ?? {};

  switch (field.type) {
    case "email":
      if (!EMAIL_RE.test(String(value)))
        return "Enter a valid email address.";
      break;
    case "phone":
      if (!PHONE_RE.test(String(value).trim()))
        return "Enter a valid phone number.";
      break;
    case "url":
      if (!URL_RE.test(String(value).trim()))
        return "Enter a valid website address.";
      break;
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "Enter a number.";
      if (v.min !== undefined && n < v.min) return `Must be at least ${v.min}.`;
      if (v.max !== undefined && n > v.max) return `Must be at most ${v.max}.`;
      break;
    }
    case "range": {
      const n = Number(value);
      const min = v.min ?? 0;
      const max = v.max ?? 100;
      if (!Number.isFinite(n) || n < min || n > max)
        return `Choose a value between ${min} and ${max}.`;
      break;
    }
    case "rating": {
      const n = Number(value);
      const max = field.maxRating ?? 5;
      if (!Number.isFinite(n) || n < 1 || n > max)
        return `Choose a rating from 1 to ${max}.`;
      break;
    }
    case "date": {
      const s = String(value);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s)))
        return "Enter a valid date.";
      break;
    }
    case "time":
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(String(value)))
        return "Enter a valid time.";
      break;
    case "select":
    case "radio": {
      const allowed = (field.options ?? []).map((o) => o.value);
      if (allowed.length && !allowed.includes(String(value)))
        return "Choose one of the available options.";
      break;
    }
    case "multiselect":
    case "checkboxGroup": {
      const chosen = value as string[];
      const allowed = (field.options ?? []).map((o) => o.value);
      if (allowed.length && chosen.some((c) => !allowed.includes(c)))
        return "Choose from the available options.";
      if (v.minSelected !== undefined && chosen.length < v.minSelected)
        return `Select at least ${v.minSelected} option${v.minSelected === 1 ? "" : "s"}.`;
      if (v.maxSelected !== undefined && chosen.length > v.maxSelected)
        return `Select no more than ${v.maxSelected} option${v.maxSelected === 1 ? "" : "s"}.`;
      break;
    }
    case "text":
    case "textarea": {
      const s = String(value);
      if (s.length > LIMITS.textAnswerMax) return "That answer is too long.";
      if (v.minLength !== undefined && s.length < v.minLength)
        return `Use at least ${v.minLength} characters.`;
      if (v.maxLength !== undefined && s.length > v.maxLength)
        return `Use at most ${v.maxLength} characters.`;
      if (v.pattern && s.length <= MAX_PATTERN_INPUT && !isRiskyPattern(v.pattern)) {
        try {
          if (!new RegExp(v.pattern).test(s))
            return v.patternMessage || "That value doesn't look right.";
        } catch {
          /* an invalid author-supplied pattern never blocks a respondent */
        }
      }
      break;
    }
    default:
      break;
  }

  return null;
}

export interface AnswerValidationResult {
  errors: Record<string, string>;
  cleaned: Record<string, AnswerValue>;
}

/** Validate + normalise every answerable field on a form. */
export function validateAnswers(
  fields: FormField[],
  raw: Record<string, unknown>,
): AnswerValidationResult {
  const errors: Record<string, string> = {};
  const cleaned: Record<string, AnswerValue> = {};

  for (const field of fields) {
    if (!isAnswerable(field.type)) continue;
    const value = coerceAnswer(field, raw[field.id]);
    const error = validateAnswer(field, raw[field.id]);
    if (error) errors[field.id] = error;
    cleaned[field.id] = value;
  }

  return { errors, cleaned };
}

/** First error message from a zod parse, ready to show in a toast. */
export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the values you entered.";
}
