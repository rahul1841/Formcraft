# Formcraft

Formcraft is a no-code form builder: an admin signs in, drags fields onto a canvas, restyles the form
until it matches their brand, publishes it at a public `/f/<slug>` link, and then reads the answers
back as charts, a response table, or a CSV/JSON download. Everything — field definitions, theme,
settings and responses — lives in MongoDB, and no part of building or customising a form requires
writing code. It is a single Next.js 16 App Router application: React Server Components render the
pages, route handlers under `/api` provide the JSON API, and mongoose talks to the database.

---

## Features

### Form creation & customisation

| Capability | Where it lives |
| --- | --- |
| 18 field types — short/long text, email, phone, number, URL, date, time, dropdown, multi-select, radio, checkboxes, single consent checkbox, star rating, slider, plus heading, paragraph and divider layout blocks | `src/lib/constants.ts` (`FIELD_META`), `src/components/form/FieldRenderer.tsx` |
| Drag-and-drop canvas with reorder, duplicate and delete (`@dnd-kit`) | `src/components/builder/` |
| Per-field settings: label, placeholder, help text, required toggle, default value, options with custom values, option layout (vertical / horizontal / grid) | builder inspector panel |
| Per-field validation: min/max length, min/max number, regex pattern with a custom message, min/max selected | `src/lib/validation.ts` |
| Layout control: full / half / third field width and left / centre / right alignment | `FormField.width`, `FormField.align` |
| Styling: primary, background, card, text, muted and border colours, 8 font families, 3 text sizes, corner radius, spacing density, input style (outlined / filled / underlined), button style and alignment, label alignment, form max width, question numbers, background pattern, cover image | `src/lib/types.ts` (`FormTheme`), `src/lib/theme.ts` |
| 8 ready-made theme presets and 6 starter templates (blank, contact, feedback, event, job, survey) | `THEME_PRESETS`, `FORM_TEMPLATES` |
| Live preview — the builder renders the exact component the public page uses | `src/components/form/FormRenderer.tsx` |

### Form management

- Dashboard listing every form with search, status filter and sorting (recent, created, title, responses).
- Draft / published / closed status, with a shareable link and copy button once published.
- Create from a template, duplicate an existing form, rename, edit and delete.
- Per-form settings: submit button text, success message, redirect URL, progress bar, repeat submissions,
  response limit and the message shown once a form is closed.

### User interaction

- Public form at `/f/<slug>` — no account needed, styled by the form's own theme.
- Client-side validation on blur/submit with the same rules the server enforces, plus inline error messages.
- Accessible markup: real `<label>` elements, `aria-invalid` / `aria-describedby` wiring, keyboard-reachable
  controls and visible focus rings.
- Responsive from 375px upward; the form card, option grids and admin tables all reflow.
- Draft and closed forms show a "this form is closed" screen instead of the fields, submissions past the
  response limit are rejected with that same message, and an unknown slug renders the 404 page.

### Data storage & retrieval

- Every response is stored in MongoDB with a snapshot of the field labels/types it was answered against,
  so renaming a question later never scrambles old data.
- Response table with pagination, full-text-ish search, single-response detail and delete (one or all).
- Analytics: totals, responses today / this week, average completion time, completion rate, a 30-day
  timeline and a per-field breakdown (option counts and percentages, average/min/max/median for numeric
  and rating fields, recent samples for free-text fields).
- One-click export to CSV or JSON.

---

## Quick start

Requires **Node.js 20.9+** and a MongoDB database (local `mongod` or a free MongoDB Atlas cluster).

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create your env file**

   ```bash
   cp .env.example .env.local
   ```

3. **Fill in `MONGODB_URI` and `AUTH_SECRET`** in `.env.local`

   ```bash
   # a 32+ character random string for signing the session cookie
   openssl rand -base64 32
   ```

   `MONGODB_URI` can be `mongodb://127.0.0.1:27017/formcraft` for a local server, or the
   `mongodb+srv://…` string from Atlas.

4. **(Optional) Seed demo data** — creates an admin plus five published forms with a month of responses

   ```bash
   npm run seed
   ```

   It prints the credentials it created (default `admin@formcraft.dev` / `formcraft123`).
   Re-run with `npm run seed -- --force` to wipe that account's forms and start over.

5. **Start the dev server**

   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000/register](http://localhost:3000/register)** and create your admin
   account — or go to `/login` and use the seeded credentials from step 4.

---

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | — | MongoDB connection string. The database name may be part of the URI path (`…/formcraft`). |
| `MONGODB_DB` | No | from the URI | Overrides the database name, useful when the URI has none. |
| `AUTH_SECRET` | Yes | — | HS256 signing key for the session JWT. Must be at least 16 characters; use 32+. Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Base URL used to build shareable `/f/<slug>` links. |
| `SEED_ADMIN_EMAIL` | No | `admin@formcraft.dev` | Demo admin created by `npm run seed`. |
| `SEED_ADMIN_PASSWORD` | No | `formcraft123` | Password for that demo admin (min 8 characters). |
| `SEED_ADMIN_NAME` | No | `Demo Admin` | Display name for that demo admin. |

`.env.local` is git-ignored; `.env.example` is the committed template.

---

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build (run `build` first). |
| `npm run lint` | ESLint over the project. |
| `npm run lint:fix` | ESLint with `--fix`. |
| `npm run typecheck` | `tsc --noEmit` against the strict TypeScript config. |
| `npm run seed` | Populate MongoDB with a demo admin, one form per template and realistic responses. Add `-- --force` to replace existing demo data. |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React Server Components, route handlers) |
| Language | TypeScript 5 in `strict` mode |
| UI | React 19, Tailwind CSS v4 (CSS-first config in `src/app/globals.css`), lucide-react icons |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` |
| Charts | Recharts 3 |
| Database | MongoDB with mongoose 9 |
| Validation | Zod 4, shared by the client renderer and the API |
| Auth | bcryptjs password hashing + a `jose` HS256 JWT in an HttpOnly `ncf_session` cookie (7 days) |
| Seeding | `tsx` running `scripts/seed.ts` outside Next.js |

---

## Project structure

```
.
├── scripts/
│   └── seed.ts                  Standalone seeder (own .env parser, no server-only imports)
├── src/
│   ├── app/
│   │   ├── (auth)/              Login + register pages sharing one centred layout
│   │   ├── admin/               Auth-guarded admin: dashboard, builder, responses
│   │   ├── api/                 Route handlers — the JSON API below
│   │   ├── f/[slug]/            The public, fillable form
│   │   ├── globals.css          Tailwind v4 theme tokens + the .ncf-* form styles
│   │   ├── layout.tsx           Root layout: fonts, metadata, toast provider
│   │   └── page.tsx             Marketing landing page
│   ├── components/
│   │   ├── admin/               Admin shell (nav) and dashboard client
│   │   ├── analytics/           Analytics panel and Recharts wrappers
│   │   ├── auth/                Shared sign-in / sign-up form
│   │   ├── builder/             Drag-and-drop builder, inspector, builder context
│   │   ├── form/                FormRenderer + FieldRenderer — used by preview and public page
│   │   └── ui/                  Primitives: Button, Input, Card, Modal, Toast, Tabs, …
│   ├── lib/
│   │   ├── analytics.ts         computeAnalytics(form, submissions) — pure
│   │   ├── api-client.ts        Typed fetch wrapper that unwraps the ok()/fail() envelope
│   │   ├── auth.ts              Hashing, JWT session cookie, requireApiUser() (server-only)
│   │   ├── constants.ts         Field metadata, theme presets, defaults, limits
│   │   ├── data.ts              Query helpers for forms and submissions (server-only)
│   │   ├── db.ts                Cached mongoose connection
│   │   ├── fields.ts            createField / duplicateField / makeSlug
│   │   ├── http.ts              ok(), fail(), handleApiError(), clientIp()
│   │   ├── serialize.ts         Mongo documents → the shared client-safe types
│   │   ├── templates.ts         The six starter templates
│   │   ├── theme.ts             FormTheme → CSS custom properties
│   │   ├── types.ts             Single source of truth for every domain type
│   │   ├── utils.ts             cn, dates, answerToText, submissionsToCsv, colours
│   │   └── validation.ts        Zod schemas + shared answer validation
│   └── models/                  Mongoose schemas: User, Form, Submission
├── .env.example                 Copy to .env.local
└── package.json
```

---

## API reference

All admin endpoints require the `ncf_session` cookie and return `401` without it. Successful responses
use the envelope `{ "ok": true, "data": { … } }`; failures use `{ "ok": false, "error": "…", "fieldErrors"?: { … } }`.
The one exception is the export endpoint, which streams a file.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Create the admin account and start a session. |
| `POST` | `/api/auth/login` | No | Sign in and start a session. |
| `POST` | `/api/auth/logout` | No | Clear the session cookie. |
| `GET` | `/api/auth/me` | Yes | Current user; `401` when signed out. |
| `GET` | `/api/forms?search=&status=&sort=` | Yes | List the owner's forms plus dashboard stats. |
| `POST` | `/api/forms` | Yes | Create a form, optionally from `templateId`. |
| `GET` | `/api/forms/:id` | Yes | Full form document. |
| `PATCH` | `/api/forms/:id` | Yes | Partial update of title, description, status, fields, theme or settings. |
| `DELETE` | `/api/forms/:id` | Yes | Delete a form and its responses. |
| `POST` | `/api/forms/:id/duplicate` | Yes | Copy a form as a new draft with its own slug; responses are not copied. |
| `GET` | `/api/forms/:id/responses?page=&limit=&search=` | Yes | Paginated responses. |
| `DELETE` | `/api/forms/:id/responses` | Yes | Delete every response for the form. |
| `DELETE` | `/api/forms/:id/responses/:responseId` | Yes | Delete one response. |
| `GET` | `/api/forms/:id/analytics` | Yes | Computed `FormAnalytics` for the dashboard. |
| `GET` | `/api/forms/:id/export?format=csv\|json` | Yes | File download of every response. |
| `GET` | `/api/public/forms/:slug` | No | Public form definition (theme + fields, no counts). |
| `POST` | `/api/public/forms/:slug/submit` | No | Submit `{ data, durationMs? }`; returns the success message and any redirect. |

Page routes: `/` (landing), `/login`, `/register`, `/admin` (dashboard),
`/admin/forms/:id/edit` (builder), `/admin/forms/:id/responses` (responses + analytics),
`/f/:slug` (public form).

---

## Data model

Three collections, defined in `src/models/`.

### `users`

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Unique, lower-cased, indexed. |
| `name` | string | Display name. |
| `passwordHash` | string | bcrypt hash, cost 10. Never leaves the server. |
| `role` | `"admin"` | Reserved for future roles. |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps. |

### `forms`

| Field | Type | Notes |
| --- | --- | --- |
| `title`, `description` | string | Shown at the top of the public form. |
| `slug` | string | Unique, indexed; the public URL is `/f/<slug>`. |
| `status` | `draft` \| `published` \| `closed` | Only `published` forms accept responses. |
| `fields` | `FormField[]` | Embedded documents: id, type, label, required, width, align, options, validation and type-specific extras (`rows`, `maxRating`, `step`, `content`, `headingLevel`, `checkboxLabel`, `optionLayout`). |
| `theme` | `FormTheme` | Colours, font, radius, spacing, input/button style, alignment, max width, background pattern, cover image. |
| `settings` | `FormSettings` | Submit label, success message, redirect URL, progress bar, repeat submissions, response limit, closed message. |
| `ownerId` | ObjectId → `users` | Indexed; every admin query is scoped by it. |
| `responseCount` | number | Denormalised counter kept in step with the submissions collection. |
| `publishedAt` | Date \| null | Set the first time the form goes live. |

Compound index on `{ ownerId, updatedAt }` backs the dashboard listing.

### `submissions`

| Field | Type | Notes |
| --- | --- | --- |
| `formId` | ObjectId → `forms` | Indexed together with `submittedAt`. |
| `ownerId` | ObjectId → `users` | Lets an owner's data be cleaned up in one query. |
| `data` | `Record<fieldId, AnswerValue>` | Mixed: string, string[], number, boolean or null, normalised by `coerceAnswer`. |
| `fieldSnapshot` | `{ id, label, type }[]` | The questions as they read at submission time — keeps exports readable after edits. |
| `searchText` | String | All answers flattened to one indexed string. MongoDB cannot regex-match inside the Mixed `data` sub-document, so response search runs against this. |
| `submittedAt` | Date | Indexed, used for the timeline. |
| `meta` | `{ userAgent, ip, durationMs }` | `durationMs` feeds the average completion time. |

---

## How it works

1. **Build.** `/admin/forms/:id/edit` loads the form into a builder context. Adding, reordering or editing a
   field mutates that context; the preview re-renders with the very same `FormRenderer` the public page uses,
   so what the admin sees is what the respondent gets. Saving `PATCH`es the changed slice of the document.
2. **Publish.** Flipping the status to `published` stamps `publishedAt` and turns on the public route.
3. **Share.** The form is live at `/f/<slug>` (prefixed by `NEXT_PUBLIC_APP_URL` when you copy the link).
4. **Collect.** The public page validates answers in the browser, then `POST`s to
   `/api/public/forms/:slug/submit`, which re-validates with the identical rules and rejects submissions to
   closed forms. A response slot is claimed with a single conditional `$inc`, so two simultaneous submissions
   can never both slip past a `responseLimit`; only then is the submission written, with its field snapshot.
   With **Allow multiple submissions** turned off, the route sets a long-lived `ncf_done_<formId>` cookie and
   refuses a second response from the same browser — the right guarantee for an anonymous form, though (like
   every cookie-based limit) a different browser or a cleared cookie jar starts fresh.
5. **Analyse.** `/admin/forms/:id/responses` shows the response table and the analytics computed by
   `computeAnalytics()`, and exports the whole set as CSV or JSON.

---

## Troubleshooting

**`MONGODB_URI is not set`**
The app or the seeder could not find a connection string. Make sure `.env.local` exists in the project root
(`cp .env.example .env.local`), that it contains a `MONGODB_URI=` line, and restart `npm run dev` — Next.js only
reads env files at startup.

**`Could not reach MongoDB` / `ECONNREFUSED` / `ServerSelection` errors**
For a local database, check that `mongod` is actually running on the port in your URI. For Atlas, add your
current IP under **Network Access → IP Access List** (a laptop on a new network needs re-adding), confirm the
cluster is not paused, and URL-encode any special characters in the password inside the SRV string.

**A form author's custom regex (Field → Advanced validation) seems to be ignored**
Author-supplied patterns run on the public submit route against respondent input, so a catastrophically
backtracking pattern would be an unauthenticated CPU denial of service. Patterns over 200 characters, and those
containing a quantified group whose body itself holds a quantifier or alternation (`(a+)+`, `(a|aa)+`), are
refused rather than executed, and matching is capped at 512 characters of input. Rewrite the pattern without the
nested quantifier and it will be enforced again.

**`AUTH_SECRET is missing or too short`**
Session signing needs at least 16 characters, and 32+ is recommended. Generate one and paste it into
`.env.local`:

```bash
openssl rand -base64 32
```

Changing `AUTH_SECRET` invalidates every existing session, so everyone signs in again.

**`npm run seed` says the account already has forms**
That is the safety guard — it refuses to overwrite real data. Re-run it as `npm run seed -- --force` to delete
that admin's forms and responses first, or point `SEED_ADMIN_EMAIL` at a different account.

**The public link shows "This form is closed"**
Only `published` forms render their fields — a draft or a closed form shows that screen instead, and so does a
form that has hit its response limit. Flip the status in the builder. If the link 404s instead, the slug is
wrong: slugs are fixed when the form is created, so renaming a form never changes its URL.
