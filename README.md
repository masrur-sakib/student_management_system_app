# SMS Registry Module

I built a full-stack Student Management System (SMS) Registry Module using **Next.js (App Router)**, **Tailwind CSS**, **Prisma 7**, and **PostgreSQL (Neon)**. I implemented both **Staff View** and **Student View** workflows covering enrolment, tuition fee tracking, coursework assessment/submission handling, and marksheet grading.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **ORM & Database:** Prisma 7 (`prisma-client` TypeScript generator + `@prisma/adapter-neon`) with PostgreSQL hosted on Neon
- **Language:** TypeScript

## Core Domain Features & Rules

1. **Student Enrolment & Sequential IDs**
   - I implemented student record creation linked to academic programmes with auto-incrementing sequential student codes in the format `SMS-YYYY-NNNN` (for example, `SMS-2026-0001`).
   - I added search and filtering by keyword (name, student ID, or email), programme, and enrolment status (`ENROLLED`, `DEFERRED`, `WITHDRAWN`, `COMPLETED`), along with student status updates.

2. **Tuition Fees, Balances & Overdue Alerts**
   - I calculated tuition balances from programme tuition fees and recorded payments.
   - I flagged overdue fee accounts and surfaced overdue alerts through the registry banner and student fee summaries.

3. **Assessments & File Submissions**
   - I built workflows for staff to create assessments with deadlines and for students to upload coursework submissions in the Student View.
   - I enforced **one submission file per student per assessment**.
   - I **blocked resubmissions after the deadline** and **flagged late uploads** when submitted past the due date.

4. **Marksheet & Grade Classification**
   - I recorded numeric scores (`0–100`) per student and assessment with publication control (`isPublished`).
   - I classified marks into standard grade bands (**Distinction**, **Merit**, **Pass**, or **Fail**).

## Project Structure

```text
├── app/
│   ├── api/
│   │   ├── overview/        # Aggregated registry overview & filtered queries
│   │   ├── students/        # Student creation, search/filtering & status updates
│   │   ├── payments/        # Tuition fee payment recording
│   │   ├── assessments/     # Assessment creation & listing
│   │   ├── submissions/     # File submission handling, deadline & late checks
│   │   └── grades/          # Grade entry, classification & publish toggle
│   ├── enrolment/           # Enrolment workflow view
│   ├── fees/                # Fees & payments workflow view
│   ├── assessments/         # Assessments & submissions workflow view
│   ├── marksheet/           # Marksheet & grading workflow view
│   ├── layout.tsx           # Root layout & fonts
│   └── page.tsx             # Main registry shell entry point
├── components/
│   ├── RegistryShell.tsx    # Top header, Staff/Student toggle, nav bar & role views
│   ├── OverviewSectionCard.tsx
│   ├── OverdueBanner.tsx
│   ├── EnrolmentPanel.tsx
│   ├── PaymentsPanel.tsx
│   ├── AssessmentsPanel.tsx
│   ├── MarksheetPanel.tsx
│   └── StudentWorkspace.tsx
├── lib/
│   ├── prisma.ts            # Prisma 7 client with Neon adapter
│   ├── domain.ts            # Fee balance, overdue & score classification logic
│   └── types.ts             # Shared DTOs and TypeScript types
├── prisma/
│   ├── schema.prisma        # Database models & relations
│   └── seed.ts              # Seed script for initial programmes, students & records
└── prisma.config.ts         # Prisma 7 configuration
```

## Environment Variables

I created a `.env` or `.env.local` file in the project root with my Neon PostgreSQL connection strings:

```env
# Pooled connection string used at runtime by @prisma/adapter-neon
DATABASE_URL="postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require"

# Direct (unpooled) connection string used by Prisma CLI / migrations
DIRECT_URL="postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/<dbname>?sslmode=require"
```

## Local Setup & Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Generate Prisma Client & push/migrate schema to Neon:**

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   _(During local schema iteration, I used `npx prisma db push` or `npx prisma migrate dev`.)_

3. **Seed the database:**

   ```bash
   npx prisma db seed
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in my browser.

## How AI Was Used During the Build

I integrated AI as an end-to-end engineering partner from initial project setup through production deployment on Vercel:

- **Planning, Database Schema & Domain Architecture:** I used AI from the outset to map out the assessment requirements into a clean Prisma 7 schema (`Programme`, `Student`, `Payment`, `Assessment`, `Submission`, `Mark`) configured with `@prisma/adapter-neon` for PostgreSQL, alongside core domain rules for sequential `SMS-YYYY-NNNN` ID generation, fee balance/overdue calculations, deadline enforcement, and grade classification.
- **Full-Stack Implementation & Component Modularization:** I leveraged AI to scaffold the Next.js App Router API routes and break down the interface into focused, maintainable React components (`RegistryShell`, `EnrolmentPanel`, `PaymentsPanel`, `AssessmentsPanel`, `MarksheetPanel`, `StudentWorkspace`, and `OverdueBanner`).
- **UI/UX & Styling Iteration:** I collaborated with AI to refine the Tailwind CSS layout—including the sticky global header with centered `Staff View` / `Student View` switching, cohesive sub-navigation tabs, responsive four-card overview grid, and structured form/table dividers.
- **Debugging, Build Optimization & Deployment:** I relied on AI to diagnose and resolve React hydration mismatches, TypeScript type errors, Next.js dynamic route prerendering bailouts during `npm run build`, and environment configuration for Neon and Vercel.
- **Testing & Human Verification:** I manually reviewed, tested locally, and verified every AI-assisted output—across schema migrations, seed data, API validations, edge cases (such as late/duplicate submissions and overdue payment alerts), and production builds—against all assessment criteria.
