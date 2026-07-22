# Vittora — CA Practice Client Manager

A modern, responsive, secure ERP for **Chartered Accountant practices** to manage
client information — PAN/GST records, portal credentials, and the auto-generated
AIS password — in a clean CRM-style dashboard.

Built with **Next.js (App Router) + TypeScript**, **Prisma + SQLite**, and
**Tailwind CSS**. The UI is a faithful implementation of the *Ledger Desk*
design: a warm-paper light theme, a considered dark theme, sortable/searchable
tables, and reveal-on-click credential fields.

> **🔴 Live demo:** https://claude.ai/code/artifact/259dc1d9-e3ad-474b-aa94-d9f010fb0c2f
> Sign in with **admin / admin123**. The demo runs entirely client-side (data in
> your browser's `localStorage`); this repository is the full-stack app with a
> real API + database.

---

## ✨ Features

- **Dev-mode authentication** — auto-filled `admin` / `admin123`, structured so a
  real identity provider drops in by replacing a single function.
- **Dashboard** — stat cards (total / individuals / companies / last updated) and
  a recent-clients table.
- **Client register** — searchable, filterable, sortable, paginated table.
  - Search by **Name, PAN, Phone, GST, Email**
  - Filter by **Individual / Company**
  - Sort by **Name, PAN, Date created, Recently updated**
  - Columns: Client Name, PAN, Password, Phone, Email, GST, Portal User ID,
    Portal Password (passwords masked with reveal toggle).
- **Client CRUD** — add / edit / delete with a validated form (PAN, email, phone,
  GST formats) and a details page holding the sensitive fields (Aadhaar, DOB/DOF,
  address, AIS password).
- **Auto-generated AIS password** — `AIS = PAN + DOB` (digits only), stored in the
  database, hidden from the list, shown only on the details page, and regenerated
  automatically whenever the PAN or DOB changes.
- **Bulk import** — upload `.xlsx` / `.csv`, validated for missing PAN, duplicate
  PAN, invalid email/GST/phone, with an imported/failed error report.
- **Export** — all clients to Excel or CSV, **Full** (incl. credentials) or
  **Basic** (name, PAN, contact, GST).
- **Downloadable import template** — `.xlsx` and `.csv`.
- **Modern UI** — left sidebar, responsive layout, **dark mode**, loading &
  empty states, toast notifications, and confirmation dialogs.

---

## 🧱 Tech stack

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript               |
| Database  | SQLite via Prisma ORM (swap to PostgreSQL easily)  |
| Styling   | Tailwind CSS + a CSS-variable design system        |
| Auth      | Signed-cookie session (HMAC-SHA256), swappable     |
| Import/Export | SheetJS (`xlsx`)                               |
| Icons     | `lucide-react`                                      |
| Validation | `zod`                                             |

---

## 🚀 Getting started

### Prerequisites
- Node.js 18.18+ (tested on Node 22)

### 1. Install
```bash
npm install
```

### 2. Set up the database + seed sample data
```bash
npm run setup      # runs the Prisma migration and seeds 5 sample clients
```
This creates `prisma/dev.db` (SQLite) and loads the five sample clients.

### 3. Run
```bash
npm run dev        # development, http://localhost:3000
# or
npm run build && npm start   # production build
```

Open **http://localhost:3000** and sign in with **admin / admin123**.

### Handy scripts
| Script            | What it does                               |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start the dev server                       |
| `npm run build`   | `prisma generate` + production build       |
| `npm start`       | Start the production server                |
| `npm run db:seed` | Re-seed the sample clients                 |
| `npm run db:reset`| Drop, re-migrate and re-seed the database  |

---

## 🔐 Environment variables (`.env`)

```dotenv
DATABASE_URL="file:./dev.db"          # SQLite; swap for a Postgres URL
AUTH_SECRET="change-me-in-production" # signs the session cookie
DEV_AUTH_USERNAME="admin"
DEV_AUTH_PASSWORD="admin123"
```

---

## 🗂️ Project structure

```
prisma/
  schema.prisma          # Client model (PAN unique) + migrations
  seed.ts                # 5 sample clients
src/
  app/
    login/               # login page
    (app)/               # authenticated shell (sidebar + topbar)
      dashboard/         # dashboard
      clients/           # list + [id] details page
      import/  export/   # bulk import & export
    api/
      auth/              # login / logout
      clients/           # CRUD, import, export, template
  components/            # AppShell, tables, modals, toasts, views
  lib/
    ais.ts               # AIS password generator
    auth.ts              # ⭐ authenticate() — the swap point for real auth
    validation.ts        # PAN / GST / email / phone validators (zod)
    prisma.ts            # Prisma client singleton
    spreadsheet.ts       # xlsx/csv import, export, template
  middleware.ts          # route protection
```

---

## 🧩 The AIS password rule

```
AIS Password = PAN + DOB(digits only), upper-cased

PAN: ABCDE1234F   DOB: 01/01/1995   →   ABCDE1234F01011995
```

Implemented once in `src/lib/ais.ts` and applied on create, update and import.
Companies (no DOB) have no AIS password.

---

## 🔁 Swapping in real authentication

Auth is deliberately isolated. To go live, replace the body of
`authenticate()` in [`src/lib/auth.ts`](src/lib/auth.ts) with a database lookup +
password-hash comparison (e.g. `bcrypt`), or delegate to NextAuth / Clerk / Auth0.
Everything else depends only on `getSessionUser()` and the cookie helpers, so no
other code needs to change.

## 🐘 Switching to PostgreSQL

1. In `prisma/schema.prisma` set `datasource.provider = "postgresql"` (and you can
   promote `type` to a real Prisma `enum`).
2. Set `DATABASE_URL` to your Postgres connection string.
3. `npx prisma migrate dev`.

---

## ☁️ Deploying

Two ready-made paths. Neither can be run from inside this build session (no
hosting credentials live here) — both are a few minutes of clicking on your
end.

### Option A — Vercel + Neon Postgres (recommended, free tier)

Vercel's filesystem is read-only/ephemeral, so SQLite won't persist there —
swap in a free hosted Postgres first.

1. **Create a database.** Sign up at [neon.tech](https://neon.tech) (or
   Supabase / Vercel Postgres), create a project, and copy its connection
   string (`postgresql://...`).
2. **Switch the provider.** In `prisma/schema.prisma` change:
   ```diff
   datasource db {
   -  provider = "sqlite"
   +  provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   (Optional: promote `type String` back to a real `enum ClientType` — Postgres
   supports native enums, unlike SQLite.)
3. **Push this repo to GitHub**, then [import it in Vercel](https://vercel.com/new).
4. **Set environment variables** in the Vercel project settings:
   - `DATABASE_URL` — your Neon connection string
   - `AUTH_SECRET` — any random 32+ character string
   - `DEV_AUTH_USERNAME` / `DEV_AUTH_PASSWORD` — keep or change the demo login
5. **Deploy.** Vercel runs `npm run build` (which runs `prisma generate`)
   automatically.
6. **Apply the schema** to your new database once, from your machine:
   ```bash
   DATABASE_URL="<your neon connection string>" npx prisma migrate deploy
   DATABASE_URL="<your neon connection string>" npx tsx prisma/seed.ts   # optional sample data
   ```

You'll get a `https://<project>.vercel.app` URL.

### Option B — Docker, anywhere (Railway, Render, Fly.io, a VPS)

No database migration needed — SQLite persists on a mounted volume. A
`Dockerfile`, `docker-compose.yml`, and `docker-entrypoint.sh` are already in
the repo (multi-stage build on `node:20-slim`, Next.js `output: "standalone"`,
runs `prisma migrate deploy` on every boot before starting the server).

```bash
# generate a random AUTH_SECRET first, e.g.: openssl rand -base64 32
AUTH_SECRET="<paste a random secret>" docker compose up --build
```

Or point Railway/Render/Fly's "Deploy from Dockerfile" at this repo directly
and set `AUTH_SECRET` (and `DATABASE_URL` if you'd rather use their managed
Postgres than the SQLite volume) in their dashboard.

> Verified in this session: the production build (`npm run build`, standalone
> output) boots and correctly serves login, auth, and the dashboard — the
> exact runtime path `docker-entrypoint.sh` executes. The `docker build` step
> itself pulls `node:20-slim` from Docker Hub, which this sandbox's network
> policy blocks — that pull will succeed normally on your machine or CI.

---

## 🛣️ Future-ready

The schema and structure leave room for: multiple CA firms, staff logins &
role-based permissions, document storage & uploads, ITR / GST / TDS tracking,
compliance reminders, activity logs, audit history, encrypted credentials, and
two-factor authentication.
