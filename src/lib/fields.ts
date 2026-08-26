import { nanoid } from "nanoid";
import { FIELD_META, hasOptions } from "@/lib/constants";
import type { FieldOption, FieldType, FormField } from "@/lib/types";

export function newId(size = 10): string {
  return nanoid(size);
}

export function createOption(label: string, value?: string): FieldOption {
  return { id: newId(6), label, value: value ?? label };
}

export function defaultOptions(): FieldOption[] {
  return [
    createOption("Option 1"),
    createOption("Option 2"),
    createOption("Option 3"),
  ];
}

/** Build a brand new field of the given type with sensible defaults. */
export function createField(type: FieldType): FormField {
  const meta = FIELD_META[type];
  const base: FormField = {
    id: newId(),
    type,
    label: meta.name,
    required: false,
    width: "full",
    align: "left",
  };
  const field: FormField = { ...base, ...meta.defaults, id: base.id, type };
  if (hasOptions(type) && !field.options) {
    field.options = defaultOptions();
  }
  return field;
}

/** Copy a field, giving it (and its options) fresh ids. */
export function duplicateField(field: FormField): FormField {
  return {
    ...field,
    id: newId(),
    label: field.label,
    options: field.options?.map((o) => ({ ...o, id: newId(6) })),
  };
}

/** Human readable, stable-ish slug for a form title. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48)
    .replace(/^-|-$/g, "");
  return base || "form";
}

export function makeSlug(title: string): string {
  return `${slugify(title)}-${nanoid(6).toLowerCase().replace(/[^a-z0-9]/g, "0")}`;
}
