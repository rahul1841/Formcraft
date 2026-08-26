import { createField, createOption, newId } from "@/lib/fields";
import type { FormField, FormTheme } from "@/lib/types";

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  title: string;
  formDescription: string;
  theme?: Partial<FormTheme>;
  build: () => FormField[];
}

function f(
  type: Parameters<typeof createField>[0],
  patch: Partial<FormField> = {},
): FormField {
  return { ...createField(type), ...patch, id: newId() };
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "blank",
    name: "Blank form",
    description: "Start from an empty canvas",
    emoji: "📄",
    title: "Untitled form",
    formDescription: "",
    build: () => [f("text", { label: "Your name", required: true })],
  },
  {
    id: "contact",
    name: "Contact us",
    description: "Name, email and a message",
    emoji: "✉️",
    title: "Contact us",
    formDescription: "We usually reply within one business day.",
    build: () => [
      f("text", {
        label: "Full name",
        placeholder: "Jane Doe",
        required: true,
        width: "half",
      }),
      f("email", {
        label: "Email address",
        placeholder: "jane@example.com",
        required: true,
        width: "half",
      }),
      f("select", {
        label: "What is this about?",
        required: true,
        options: [
          createOption("Sales"),
          createOption("Support"),
          createOption("Partnership"),
          createOption("Something else"),
        ],
      }),
      f("textarea", {
        label: "How can we help?",
        placeholder: "Tell us a bit more…",
        required: true,
        rows: 5,
      }),
      f("checkbox", {
        label: "Consent",
        checkboxLabel: "I agree to be contacted about my enquiry",
        required: true,
      }),
    ],
  },
  {
    id: "feedback",
    name: "Customer feedback",
    description: "Ratings plus open comments",
    emoji: "⭐",
    title: "Customer feedback",
    formDescription: "Your feedback helps us make the product better.",
    theme: { primaryColor: "#0d9488", backgroundColor: "#f0fdfa" },
    build: () => [
      f("rating", {
        label: "Overall, how satisfied are you?",
        maxRating: 5,
        required: true,
      }),
      f("range", {
        label: "How likely are you to recommend us? (0–10)",
        validation: { min: 0, max: 10 },
        step: 1,
        defaultValue: 8,
      }),
      f("radio", {
        label: "How often do you use the product?",
        optionLayout: "vertical",
        options: [
          createOption("Daily"),
          createOption("Weekly"),
          createOption("Monthly"),
          createOption("Rarely"),
        ],
        required: true,
      }),
      f("checkboxGroup", {
        label: "Which features do you use most?",
        optionLayout: "grid",
        options: [
          createOption("Dashboard"),
          createOption("Reports"),
          createOption("Integrations"),
          createOption("Mobile app"),
          createOption("API"),
        ],
      }),
      f("textarea", {
        label: "What could we do better?",
        rows: 4,
        placeholder: "Optional, but very appreciated",
      }),
      f("email", { label: "Email (if you'd like a reply)" }),
    ],
  },
  {
    id: "event",
    name: "Event registration",
    description: "RSVP with dietary needs",
    emoji: "🎟️",
    title: "Event registration",
    formDescription: "Reserve your seat for the annual meetup.",
    theme: { primaryColor: "#7c3aed", backgroundColor: "#faf5ff" },
    build: () => [
      f("heading", { content: "Attendee details", headingLevel: 2 }),
      f("text", { label: "First name", required: true, width: "half" }),
      f("text", { label: "Last name", required: true, width: "half" }),
      f("email", { label: "Email address", required: true, width: "half" }),
      f("phone", { label: "Phone number", width: "half" }),
      f("divider"),
      f("heading", { content: "Your visit", headingLevel: 2 }),
      f("date", { label: "Which day will you attend?", required: true, width: "half" }),
      f("select", {
        label: "Ticket type",
        required: true,
        width: "half",
        options: [
          createOption("General admission"),
          createOption("Student"),
          createOption("VIP"),
        ],
      }),
      f("checkboxGroup", {
        label: "Sessions you're interested in",
        optionLayout: "vertical",
        options: [
          createOption("Keynote"),
          createOption("Workshops"),
          createOption("Panel discussion"),
          createOption("Networking dinner"),
        ],
      }),
      f("textarea", {
        label: "Dietary requirements or accessibility needs",
        rows: 3,
      }),
    ],
  },
  {
    id: "job",
    name: "Job application",
    description: "Screen candidates quickly",
    emoji: "💼",
    title: "Job application",
    formDescription: "Tell us about yourself — it takes about 5 minutes.",
    theme: { primaryColor: "#111827", backgroundColor: "#f8fafc" },
    build: () => [
      f("text", { label: "Full name", required: true, width: "half" }),
      f("email", { label: "Email", required: true, width: "half" }),
      f("phone", { label: "Phone", width: "half" }),
      f("url", { label: "LinkedIn or portfolio", width: "half" }),
      f("select", {
        label: "Role you're applying for",
        required: true,
        options: [
          createOption("Frontend Engineer"),
          createOption("Backend Engineer"),
          createOption("Product Designer"),
          createOption("Product Manager"),
        ],
      }),
      f("number", {
        label: "Years of experience",
        validation: { min: 0, max: 50 },
        width: "half",
      }),
      f("date", { label: "Earliest start date", width: "half" }),
      f("textarea", {
        label: "Why do you want to work with us?",
        rows: 5,
        required: true,
      }),
      f("checkbox", {
        label: "Work authorisation",
        checkboxLabel: "I am legally authorised to work in this country",
        required: true,
      }),
    ],
  },
  {
    id: "survey",
    name: "Quick survey",
    description: "A short multi-question poll",
    emoji: "📊",
    title: "Quick survey",
    formDescription: "Six questions, about two minutes.",
    theme: { primaryColor: "#ea580c", backgroundColor: "#fff7ed" },
    build: () => [
      f("radio", {
        label: "How did you hear about us?",
        options: [
          createOption("Search engine"),
          createOption("Social media"),
          createOption("Friend or colleague"),
          createOption("Advertisement"),
          createOption("Other"),
        ],
        required: true,
      }),
      f("select", {
        label: "Which best describes you?",
        options: [
          createOption("Student"),
          createOption("Individual professional"),
          createOption("Small business"),
          createOption("Enterprise"),
        ],
        required: true,
      }),
      f("rating", { label: "Rate your experience so far", maxRating: 5 }),
      f("textarea", { label: "Anything else you'd like to share?", rows: 3 }),
    ],
  },
];

export function getTemplate(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((t) => t.id === id);
}
