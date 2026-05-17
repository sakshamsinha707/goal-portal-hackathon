# Goal Portal

AtomQuest hackathon MVP for performance goal setting, manager approval, quarterly check-ins, shared department goals, and admin reporting.

## Stack

- Next.js 16 (App Router)
- NextAuth (credentials)
- Prisma + PostgreSQL
- Tailwind CSS 4
- Recharts (admin dashboard)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` (or use the defaults below). Use a **standard** `postgresql://` URL — not `prisma+postgres://` (required for Prisma Studio and migrations).

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/goal_portal?schema=public"
   AUTH_SECRET="generate-a-long-random-string"
   AUTH_URL="http://localhost:3000"
   ```

   Generate `AUTH_SECRET` with: `openssl rand -base64 32`

3. **Start PostgreSQL & apply schema**

   With Docker (Postgres exposed on **port 5433** to avoid conflicts with a local Postgres on 5432):

   ```bash
   npm run db:up
   npm run db:migrate
   npm run db:seed
   npm run db:verify
   ```

   Without Docker, point `DATABASE_URL` at your own Postgres, then:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Optional: `npm run db:studio` to browse data; `npm run db:push` only for quick schema sync without migrations.

4. **Run dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — you will be redirected to login.

## Demo credentials

Password for all users: `GoalPortal@2026`

| Role     | Email                      |
| -------- | -------------------------- |
| Admin    | admin@atomquest.com        |
| Manager  | manager.ops@atomquest.com  |
| Manager  | manager.sales@atomquest.com |
| Employee | employee1@atomquest.com    |
| Employee | employee2@atomquest.com    |
| Employee | employee3@atomquest.com    |
| Employee | employee4@atomquest.com    |
| Employee | employee5@atomquest.com    |

## Demo flow

1. **Employee** (`employee1@atomquest.com`) — Open **My goals**, edit weightages (must total 100%), save draft, submit. Vikram’s sheet is already submitted in seed data.
2. **Manager** (`manager.ops@atomquest.com`) — **Approvals** → review Vikram’s sheet → approve or return with notes.
3. **Employee** (`employee2@atomquest.com`) — Goals already approved; open **Quarterly check-ins** and log Q1 progress.
4. **Manager** — **Check-ins** → add feedback on team entries.
5. **Admin** (`admin@atomquest.com`) — Dashboard charts, **Shared goals** push to a department, **Reports** CSV export, **Audit log**.

## Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `npm run dev`      | Start dev server           |
| `npm run db:up`    | Start local Postgres (Docker) |
| `npm run db:migrate` | Apply migrations         |
| `npm run db:studio` | Prisma Studio UI          |
| `npm run db:generate` | `prisma generate`       |
| `npm run db:push`  | Push schema (no migration files) |
| `npm run db:seed`  | Load demo data             |

## Departments & thrust areas

Seeded departments: Operations, Sales, Product Engineering.

Thrust areas: Revenue Growth, Operational Excellence, Customer Experience, People & Culture, Innovation.

FY 2026 performance cycle phases are created from the built-in calendar (goal setting May–Jun, quarterly check-in windows through Apr 2027).
