/**
 * Seed script — populates MongoDB with a demo admin, one published form per
 * template and a realistic spread of responses over the last 30 days.
 *
 * Run with:  npm run seed        (add -- --force to wipe and re-seed)
 *
 * This file runs outside Next.js, so it must not import anything that pulls in
 * "server-only" (@/lib/auth, @/lib/data). It hashes passwords with bcryptjs
 * directly and loads .env.local itself.
 */
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { DEFAULT_SETTINGS, DEFAULT_THEME, isAnswerable } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db";
import { makeSlug } from "@/lib/fields";
import { FORM_TEMPLATES } from "@/lib/templates";
import { buildSearchText } from "@/lib/utils";
import FormModel from "@/models/Form";
import SubmissionModel from "@/models/Submission";
import User from "@/models/User";
import type { AnswerValue, FieldSnapshot, FormField } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*                              env file loading                               */
/* -------------------------------------------------------------------------- */

/** Minimal .env parser — enough for KEY=value, quotes and # comments. */
function loadEnvFile(file: string): boolean {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return false;

  for (const rawLine of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).replace(/^export\s+/, "").trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);

    // A value already present in the real shell environment always wins.
    if (!process.env[key]) process.env[key] = value;
  }
  return true;
}

const envFile = [".env.local", ".env"].find(loadEnvFile);

if (!process.env.MONGODB_URI) {
  console.error(
    [
      "",
      "  MONGODB_URI is not set.",
      envFile
        ? `  Loaded ${envFile}, but it has no MONGODB_URI entry.`
        : "  No .env.local or .env file was found in the project root.",
      "",
      "  Fix it with:",
      "    cp .env.example .env.local",
      "    # then set MONGODB_URI, e.g. mongodb://127.0.0.1:27017/formcraft",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/*                                random helpers                               */
/* -------------------------------------------------------------------------- */

const rand = () => Math.random();
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const chance = (probability: number) => rand() < probability;

/** Pick 1..max distinct entries from a list. */
function pickSome<T>(list: readonly T[], max = list.length): T[] {
  const pool = [...list];
  const take = randInt(1, Math.max(1, Math.min(max, pool.length)));
  const out: T[] = [];
  for (let i = 0; i < take; i++) {
    out.push(...pool.splice(Math.floor(rand() * pool.length), 1));
  }
  return out;
}

/** Pick an index 0..n-1 with the given weights. */
function weightedIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let ticket = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    ticket -= weights[i];
    if (ticket <= 0) return i;
  }
  return weights.length - 1;
}

/* -------------------------------------------------------------------------- */
/*                                content pools                                */
/* -------------------------------------------------------------------------- */

const FIRST_NAMES = [
  "Ava", "Noah", "Mia", "Liam", "Sofia", "Ethan", "Priya", "Lucas", "Chloe",
  "Omar", "Hannah", "Diego", "Yuki", "Isabel", "Marcus", "Aisha", "Tomás",
  "Elena", "Ravi", "Nina", "Jonas", "Leila", "Sam", "Grace", "Arjun",
] as const;

const LAST_NAMES = [
  "Patel", "Nguyen", "Okafor", "Silva", "Kowalski", "Fernandez", "Tanaka",
  "Müller", "Haddad", "Rossi", "Novak", "Andersen", "Costa", "Ibrahim",
  "Larsen", "Mehta", "Dubois", "Weber", "Santos", "Kim",
] as const;

const EMAIL_DOMAINS = [
  "example.com", "mailbox.dev", "acme.co", "northwind.io", "lumen.works",
  "brightlab.dev", "orbitmail.com",
] as const;

const SHORT_TEXT = [
  "Product design", "Growth marketing", "Customer success", "Data platform",
  "Operations", "Engineering", "Finance", "People team",
] as const;

const COMPANIES = [
  "Northwind Labs", "Lumen Works", "Bright Harbor", "Acme Collective",
  "Orbit Systems", "Cedar & Co", "Meridian Studio",
] as const;

const HELP_SENTENCES = [
  "We're evaluating tools for our team of twelve and would like to understand your pricing tiers.",
  "The export button times out when I try to download a large report. Could someone take a look?",
  "I'd like to move our billing to annual invoicing — who should I talk to?",
  "Is there a way to share a form with a client without giving them an account?",
  "We need SSO before we can roll this out company-wide. Is that on the roadmap?",
  "Our team lead asked me to get a quote for onboarding support.",
  "I signed up last week and I'm not receiving the notification emails.",
] as const;

const IMPROVEMENT_SENTENCES = [
  "The dashboard is great, but I'd love to be able to pin the charts I look at every morning.",
  "Loading is quick, though the mobile layout squeezes the tables a bit.",
  "More templates would help — we rebuild the same intake form for every client.",
  "Nothing major. A dark mode would be a nice touch for late-night work.",
  "Search across responses could be smarter; exact matches only is limiting.",
  "It would help if I could duplicate a section instead of every field one by one.",
  "Honestly it already does what we need. Keep the interface this simple.",
] as const;

const DIETARY_SENTENCES = [
  "Vegetarian, no nuts please.",
  "Gluten free — thanks for asking.",
  "No dietary requirements, but I'll need step-free access to the venue.",
  "Vegan meal if that's possible.",
  "Lactose intolerant. Happy with anything else.",
  "None, thank you.",
  "I'll be bringing a guide dog; a seat near the aisle would help.",
] as const;

const MOTIVATION_SENTENCES = [
  "I've followed the product since launch and the problem space is one I've worked in for six years.",
  "Your engineering blog convinced me — I want to work somewhere that writes like that.",
  "I'm looking for a smaller team where design and engineering actually sit together.",
  "I built something similar at my last company and would love to do it properly this time.",
  "The role lines up with what I enjoy most: shipping user-facing features end to end.",
  "I want to move from agency work to a single product I can grow over years.",
] as const;

const GENERIC_SENTENCES = [
  "Thanks for putting this together — it was quick to fill in.",
  "Happy to give more detail if it's useful, just drop me a line.",
  "Nothing else to add right now.",
  "Looking forward to hearing back from the team.",
  "Great experience overall, no complaints.",
  "One small thing: a confirmation email would be reassuring.",
] as const;

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
] as const;

interface Person {
  first: string;
  last: string;
  email: string;
  phone: string;
  url: string;
}

function makePerson(): Person {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const handle = `${first}.${last}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z.]/g, "");
  return {
    first,
    last,
    email: `${handle}@${pick(EMAIL_DOMAINS)}`,
    phone: `+1 555 ${randInt(100, 989)} ${randInt(1000, 9899)}`,
    url: chance(0.5)
      ? `https://linkedin.com/in/${handle.replace(".", "-")}`
      : `https://${handle.replace(".", "")}.dev`,
  };
}

/* -------------------------------------------------------------------------- */
/*                              answer generation                              */
/* -------------------------------------------------------------------------- */

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sentencesFor(label: string): readonly string[] {
  const l = label.toLowerCase();
  if (/dietar|accessib|allerg/.test(l)) return DIETARY_SENTENCES;
  if (/why|work with us|motivat/.test(l)) return MOTIVATION_SENTENCES;
  if (/better|improve|missing/.test(l)) return IMPROVEMENT_SENTENCES;
  if (/help|enquir|inquir|message|question/.test(l)) return HELP_SENTENCES;
  return GENERIC_SENTENCES;
}

/** The canonical "no answer" value for a field type (matches coerceAnswer). */
function emptyAnswer(field: FormField): AnswerValue {
  switch (field.type) {
    case "number":
    case "range":
    case "rating":
      return null;
    case "checkbox":
      return false;
    case "multiselect":
    case "checkboxGroup":
      return [];
    default:
      return "";
  }
}

function generateAnswer(field: FormField, person: Person): AnswerValue {
  const label = (field.label || "").toLowerCase();
  const options = field.options ?? [];

  switch (field.type) {
    case "text": {
      if (/first name/.test(label)) return person.first;
      if (/last name|surname|family name/.test(label)) return person.last;
      if (/name/.test(label)) return `${person.first} ${person.last}`;
      if (/company|organisation|organization|employer/.test(label))
        return pick(COMPANIES);
      return pick(SHORT_TEXT);
    }
    case "textarea": {
      const pool = sentencesFor(field.label || "");
      return chance(0.3) ? `${pick(pool)} ${pick(pool)}` : pick(pool);
    }
    case "email":
      return person.email;
    case "phone":
      return person.phone;
    case "url":
      return person.url;
    case "number": {
      const min = field.validation?.min ?? 0;
      const max = field.validation?.max ?? 100;
      // Squared random keeps values realistically bunched near the low end.
      return min + Math.round(rand() ** 2 * (max - min));
    }
    case "range": {
      const min = field.validation?.min ?? 0;
      const max = field.validation?.max ?? 100;
      const step = field.step && field.step > 0 ? field.step : 1;
      const steps = Math.max(1, Math.floor((max - min) / step));
      // Weight the upper end — promoters outnumber detractors.
      const weights = Array.from({ length: steps + 1 }, (_, i) => (i + 1) ** 1.6);
      const value = min + weightedIndex(weights) * step;
      return Math.round(value * 1000) / 1000;
    }
    case "rating": {
      const max = field.maxRating ?? 5;
      const weights = Array.from({ length: max }, (_, i) => (i + 1) ** 2);
      return weightedIndex(weights) + 1;
    }
    case "date": {
      const d = new Date();
      d.setDate(d.getDate() + randInt(3, 45));
      return isoDate(d);
    }
    case "time":
      return `${String(randInt(8, 18)).padStart(2, "0")}:${pick(["00", "15", "30", "45"])}`;
    case "select":
    case "radio":
      return options.length ? pick(options).value : "";
    case "multiselect":
    case "checkboxGroup": {
      if (!options.length) return [];
      const max = field.validation?.maxSelected ?? Math.min(3, options.length);
      return pickSome(options, max).map((o) => o.value);
    }
    case "checkbox":
      return field.required ? true : chance(0.7);
    default:
      return "";
  }
}

interface SeedSubmission {
  formId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  data: Record<string, AnswerValue>;
  fieldSnapshot: FieldSnapshot[];
  searchText: string;
  submittedAt: Date;
  meta: { userAgent: string; ip: string; durationMs: number };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function buildSubmission(
  formId: mongoose.Types.ObjectId,
  ownerId: mongoose.Types.ObjectId,
  fields: FormField[],
): SeedSubmission {
  const person = makePerson();
  const answerable = fields.filter((f) => isAnswerable(f.type));
  const data: Record<string, AnswerValue> = {};

  for (const field of answerable) {
    // Roughly 15% of optional questions get left blank, like real traffic.
    const skipped = !field.required && chance(0.15);
    data[field.id] = skipped ? emptyAnswer(field) : generateAnswer(field, person);
  }

  // Skew towards recent days so the 30-day timeline chart trends upward.
  const dayOffset = Math.floor(rand() ** 1.4 * 30);
  const submittedAt = new Date(
    Date.now() - dayOffset * DAY_MS - randInt(0, 15) * 60 * 60 * 1000 - randInt(0, 3599) * 1000,
  );

  return {
    formId,
    ownerId,
    data,
    fieldSnapshot: answerable.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
    })),
    searchText: buildSearchText(fields, data),
    submittedAt,
    meta: {
      userAgent: pick(USER_AGENTS),
      ip: `203.0.113.${randInt(2, 250)}`,
      durationMs: randInt(25_000, 240_000),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                    seed                                     */
/* -------------------------------------------------------------------------- */

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@formcraft.dev")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "formcraft123";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Demo Admin";

const force = process.argv.slice(2).some((arg) => arg === "--force" || arg === "-f");

function table(rows: string[][]): string {
  const widths = rows[0].map((_, col) =>
    Math.max(...rows.map((r) => r[col].length)),
  );
  const line = (cells: string[]) =>
    "  " + cells.map((c, i) => c.padEnd(widths[i])).join("   ");
  const divider = "  " + widths.map((w) => "-".repeat(w)).join("   ");
  return [line(rows[0]), divider, ...rows.slice(1).map(line)].join("\n");
}

async function seed() {
  console.log(`\nConnecting to MongoDB${envFile ? ` (env: ${envFile})` : ""}…`);
  await connectToDatabase();
  console.log("Connected.\n");

  /* ------------------------------- admin user ------------------------------ */
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const user = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { $set: { name: ADMIN_NAME, passwordHash, role: "admin" } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
  if (!user) throw new Error("Could not create the demo admin user.");
  console.log(`Admin user ready: ${user.email}`);

  /* ---------------------------- existing content --------------------------- */
  const existing = await FormModel.find({ ownerId: user._id }).select("_id").lean();
  if (existing.length && !force) {
    console.log(
      [
        "",
        `This account already has ${existing.length} form${existing.length === 1 ? "" : "s"}. Nothing was changed.`,
        "Re-run with --force to delete them and seed fresh demo data:",
        "",
        "  npm run seed -- --force",
        "",
      ].join("\n"),
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  if (existing.length) {
    const ids = existing.map((f) => f._id);
    const removed = await SubmissionModel.deleteMany({
      $or: [{ formId: { $in: ids } }, { ownerId: user._id }],
    });
    await FormModel.deleteMany({ ownerId: user._id });
    console.log(
      `Removed ${existing.length} existing form(s) and ${removed.deletedCount} response(s).`,
    );
  }

  /* -------------------------------- forms ---------------------------------- */
  const templates = FORM_TEMPLATES.filter((t) => t.id !== "blank");
  const summary: string[][] = [["Form", "Slug", "Responses"]];

  for (const template of templates) {
    const fields = template.build();
    const createdAt = new Date(Date.now() - randInt(32, 48) * DAY_MS);
    const publishedAt = new Date(createdAt.getTime() + randInt(1, 36) * 60 * 60 * 1000);

    const form = await FormModel.create({
      title: template.title,
      description: template.formDescription,
      slug: makeSlug(template.title),
      status: "published",
      fields,
      theme: { ...DEFAULT_THEME, ...(template.theme ?? {}) },
      settings: { ...DEFAULT_SETTINGS },
      ownerId: user._id,
      responseCount: 0,
      publishedAt,
    });

    const submissions = Array.from({ length: randInt(18, 45) }, () =>
      buildSubmission(form._id, user._id, fields),
    );
    await SubmissionModel.insertMany(submissions);

    const lastEdit = new Date(
      Math.max(...submissions.map((s) => s.submittedAt.getTime())) - randInt(1, 10) * DAY_MS,
    );
    // `timestamps: false` keeps mongoose from stamping today's date over these.
    await FormModel.updateOne(
      { _id: form._id },
      {
        $set: {
          responseCount: submissions.length,
          createdAt,
          updatedAt: lastEdit > createdAt ? lastEdit : publishedAt,
        },
      },
      { timestamps: false },
    );

    summary.push([template.title, form.slug, String(submissions.length)]);
    console.log(`  ✓ ${template.title} — ${submissions.length} responses`);
  }

  /* -------------------------------- summary -------------------------------- */
  const total = summary.slice(1).reduce((sum, row) => sum + Number(row[2]), 0);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  console.log(`\nSeeded ${templates.length} published forms and ${total} responses.\n`);
  console.log(table(summary));
  console.log(`\nPublic form links live at ${appUrl}/f/<slug>`);
  console.log(`\nSign in at ${appUrl}/login with:`);
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nSeed failed: ${message}\n`);
  if (/ECONNREFUSED|ServerSelection|querySrv|ETIMEDOUT/i.test(message)) {
    console.error(
      [
        "  MongoDB could not be reached. Check that:",
        "    • your local mongod is running, or",
        "    • your Atlas cluster is awake and your IP is on its allowlist, and",
        "    • MONGODB_URI in .env.local is correct.",
        "",
      ].join("\n"),
    );
  }
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
