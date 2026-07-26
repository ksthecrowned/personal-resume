# JobForge Phase 1 — Foundation + Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working Next.js app where a user can sign up, save a structured profile, paste a job offer, get an AI match + letter draft, and view the result — Congo-first, French UI.

**Architecture:** New app in `jobforge/` (Next.js App Router on Vercel). PostgreSQL via Prisma (AlwaysData). Cloudflare Workers AI behind a thin `lib/ai/` adapter (mockable in tests). Phase 1 does **not** include OAuth send, R2 uploads, PDF export, or company directory (Phase 2+).

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, NextAuth v5 (credentials), Vitest, Tailwind CSS, Cloudflare Workers AI REST API.

**Spec:** `docs/superpowers/specs/2026-07-26-jobforge-saas-design.md`

## Global Constraints

- UI language: French (`fr`) for all user-facing copy
- Country focus default: `CG` (Congo-Brazzaville)
- AI must not invent employers, dates, or degrees — drafts are suggestions only
- No secrets in git; use `jobforge/.env.local` (gitignored)
- App lives in `jobforge/` at repo root; do not break existing `personal-resume` static CV site
- Phase 1 out of scope: Gmail/Outlook OAuth send, R2, Playwright PDF, annuaire, billing

## File map (Phase 1)

| Path | Responsibility |
|------|----------------|
| `jobforge/package.json` | App dependencies & scripts |
| `jobforge/prisma/schema.prisma` | Users, profiles, variants, applications |
| `jobforge/src/lib/db.ts` | Prisma client singleton |
| `jobforge/src/lib/ai/types.ts` | Shared AI DTOs |
| `jobforge/src/lib/ai/client.ts` | Workers AI HTTP client |
| `jobforge/src/lib/ai/jobs.ts` | `parseJob`, `matchProfile`, `draftLetter`, `extractCv` |
| `jobforge/src/lib/ai/mock.ts` | Deterministic mocks for Vitest |
| `jobforge/src/lib/auth.ts` | NextAuth config |
| `jobforge/src/app/api/**` | Route handlers |
| `jobforge/src/app/(app)/**` | Authenticated pages |
| `jobforge/tests/**` | Vitest unit/integration tests |

## Later plans (do not implement here)

- **Phase 2:** R2 uploads, CV extract from PDF, OAuth Gmail/Outlook send, PDF HTML templates  
- **Phase 3:** Company directory Congo seed, email verification MX/SMTP, spontaneous apply flow  
- **Phase 4:** B2B multi-tenant (post-MVP)

---

### Task 1: Scaffold Next.js app in `jobforge/`

**Files:**
- Create: `jobforge/` (Next.js app)
- Create: `jobforge/.env.example`
- Modify: root `README.md` (one short section pointing to JobForge)

**Interfaces:**
- Produces: runnable `jobforge` with `npm run dev` on port 3001

- [ ] **Step 1: Create the app**

```bash
cd d:/personal-resume
npx create-next-app@15 jobforge --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
```

Expected: `jobforge/` directory with `package.json`, `src/app/page.tsx`.

- [ ] **Step 2: Add Phase 1 dependencies**

```bash
cd jobforge
npm install prisma @prisma/client next-auth@beta bcryptjs zod
npm install -D vitest @vitejs/plugin-react @types/bcryptjs
```

- [ ] **Step 3: Add scripts to `jobforge/package.json`**

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

- [ ] **Step 4: Create `jobforge/.env.example`**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/jobforge?sslmode=require"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
CF_ACCOUNT_ID=""
CF_API_TOKEN=""
CF_AI_GATEWAY_URL=""
AI_MODE="mock"
```

- [ ] **Step 5: Create `jobforge/.gitignore` entries if missing**

Ensure `.env`, `.env.local`, `node_modules`, `.next` are ignored.

- [ ] **Step 6: Verify dev server**

```bash
cd jobforge && npm run dev
```

Expected: App responds at `http://localhost:3001`.

- [ ] **Step 7: Commit**

```bash
git add jobforge README.md
git commit -m "chore(jobforge): scaffold Next.js Phase 1 app"
```

---

### Task 2: Prisma schema + DB client

**Files:**
- Create: `jobforge/prisma/schema.prisma`
- Create: `jobforge/src/lib/db.ts`
- Create: `jobforge/tests/schema-sanity.test.ts`

**Interfaces:**
- Produces: `prisma` client export from `@/lib/db`
- Produces models: `User`, `Profile`, `Variant`, `Application`

- [ ] **Step 1: Write failing sanity test**

Create `jobforge/vitest.config.ts`:

```ts
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Create `jobforge/tests/schema-sanity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

describe("prisma enums", () => {
  it("exposes ApplicationStatus values used by the product", () => {
    expect(Prisma.ApplicationStatus).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
cd jobforge && npx prisma generate && npm test -- tests/schema-sanity.test.ts
```

Expected: FAIL (client not generated / enum missing) until schema exists.

- [ ] **Step 3: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ApplicationStatus {
  DRAFT
  MATCHED
  LETTER_READY
  SENT
  FAILED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  locale       String   @default("fr")
  countryFocus String   @default("CG")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  profile      Profile?
  variants     Variant[]
  applications Application[]
}

model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  headline  String?
  summary   String?
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Variant {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug      String
  title     String
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  applications Application[]

  @@unique([userId, slug])
}

model Application {
  id              String            @id @default(cuid())
  userId          String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  variantId       String?
  variant         Variant?          @relation(fields: [variantId], references: [id])
  companyName     String?
  jobRaw          String
  jobParsed       Json?
  matchScore      Int?
  matchPayload    Json?
  letterBody      String?
  status          ApplicationStatus @default(DRAFT)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}
```

- [ ] **Step 4: Write `src/lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Fix test to assert enum exists**

```ts
import { describe, expect, it } from "vitest";
import { ApplicationStatus } from "@prisma/client";

describe("prisma enums", () => {
  it("exposes ApplicationStatus values used by the product", () => {
    expect(ApplicationStatus.DRAFT).toBe("DRAFT");
    expect(ApplicationStatus.SENT).toBe("SENT");
  });
});
```

- [ ] **Step 6: Generate client + push schema**

```bash
cd jobforge
# set DATABASE_URL in .env.local first
npx prisma generate
npx prisma db push
npm test -- tests/schema-sanity.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add jobforge/prisma jobforge/src/lib/db.ts jobforge/tests jobforge/vitest.config.ts
git commit -m "feat(jobforge): add Prisma schema for profiles and applications"
```

---

### Task 3: AI adapter (mock + Cloudflare)

**Files:**
- Create: `jobforge/src/lib/ai/types.ts`
- Create: `jobforge/src/lib/ai/mock.ts`
- Create: `jobforge/src/lib/ai/client.ts`
- Create: `jobforge/src/lib/ai/jobs.ts`
- Create: `jobforge/src/lib/ai/index.ts`
- Create: `jobforge/tests/ai-jobs.test.ts`

**Interfaces:**
- Produces:
  - `parseJob(raw: string): Promise<ParsedJob>`
  - `matchProfile(profile: ProfileData, job: ParsedJob): Promise<MatchResult>`
  - `draftLetter(input: DraftLetterInput): Promise<string>`
  - `extractCv(text: string): Promise<ProfileData>`

- [ ] **Step 1: Write failing tests**

`jobforge/src/lib/ai/types.ts`:

```ts
export type ProfileData = {
  headline?: string;
  summary?: string;
  experiences: Array<{
    role: string;
    company: string;
    period?: string;
    bullets: string[];
  }>;
  skills: string[];
  education: Array<{ title: string; place?: string }>;
};

export type ParsedJob = {
  title: string;
  company?: string;
  skills: string[];
  level?: string;
  rawSummary: string;
};

export type MatchResult = {
  score: number;
  gaps: string[];
  suggestedVariantTitle: string;
  reasons: string[];
};

export type DraftLetterInput = {
  profile: ProfileData;
  job: ParsedJob;
  variantTitle: string;
};
```

`jobforge/tests/ai-jobs.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { draftLetter, matchProfile, parseJob } from "@/lib/ai";

describe("ai jobs (mock mode)", () => {
  beforeEach(() => {
    process.env.AI_MODE = "mock";
  });

  it("parses a job offer into title and skills", async () => {
    const job = await parseJob(
      "Poste: Développeur Full-Stack\nEntreprise: MTN Congo\nStack: Node.js, React, PostgreSQL",
    );
    expect(job.title.toLowerCase()).toContain("développeur");
    expect(job.skills.length).toBeGreaterThan(0);
  });

  it("returns a score between 0 and 100", async () => {
    const job = await parseJob("Développeur Node.js React");
    const match = await matchProfile(
      {
        experiences: [
          {
            role: "Développeur Full-Stack",
            company: "LRC",
            bullets: ["NestJS", "React"],
          },
        ],
        skills: ["Node.js", "React"],
        education: [],
      },
      job,
    );
    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(match.score).toBeLessThanOrEqual(100);
  });

  it("drafts a French letter without inventing a fake employer history", async () => {
    const letter = await draftLetter({
      profile: {
        experiences: [
          { role: "Lead", company: "LRC Group", bullets: ["Pilotage"] },
        ],
        skills: ["NestJS"],
        education: [],
      },
      job: {
        title: "Responsable Informatique",
        company: "Bralico",
        skills: ["SI"],
        rawSummary: "Pilotage SI",
      },
      variantTitle: "Responsable Informatique",
    });
    expect(letter).toMatch(/Madame, Monsieur/);
    expect(letter).toContain("LRC Group");
    expect(letter).not.toMatch(/Google|Meta|Amazon/);
  });
});
```

- [ ] **Step 2: Run tests — expect fail**

```bash
cd jobforge && npm test -- tests/ai-jobs.test.ts
```

Expected: FAIL — module `@/lib/ai` missing.

- [ ] **Step 3: Implement mock + jobs**

`jobforge/src/lib/ai/mock.ts`:

```ts
import type { DraftLetterInput, MatchResult, ParsedJob, ProfileData } from "./types";

export function mockParseJob(raw: string): ParsedJob {
  const titleMatch = raw.match(/(?:Poste|Title)\s*[:\-]\s*(.+)/i);
  const companyMatch = raw.match(/(?:Entreprise|Company)\s*[:\-]\s*(.+)/i);
  const skills = Array.from(
    new Set(
      (raw.match(/\b(Node\.?js|React|NestJS|PostgreSQL|PHP|Laravel|Flutter|AWS|SI)\b/gi) ??
        []
      ).map((s) => s.replace(/node\.?js/i, "Node.js")),
    ),
  );
  return {
    title: titleMatch?.[1]?.trim() || "Poste à pourvoir",
    company: companyMatch?.[1]?.trim(),
    skills: skills.length ? skills : ["Général"],
    rawSummary: raw.slice(0, 500),
  };
}

export function mockMatchProfile(
  profile: ProfileData,
  job: ParsedJob,
): MatchResult {
  const profileSkills = new Set(
    [...profile.skills, ...profile.experiences.flatMap((e) => e.bullets)].map(
      (s) => s.toLowerCase(),
    ),
  );
  const hits = job.skills.filter((s) =>
    [...profileSkills].some((p) => p.includes(s.toLowerCase())),
  );
  const score = Math.min(
    100,
    Math.round((hits.length / Math.max(job.skills.length, 1)) * 100),
  );
  const gaps = job.skills.filter((s) => !hits.includes(s));
  return {
    score,
    gaps,
    suggestedVariantTitle: job.title,
    reasons: hits.map((h) => `Compétence alignée: ${h}`),
  };
}

export function mockDraftLetter(input: DraftLetterInput): string {
  const company = input.job.company ?? "votre entreprise";
  const exp = input.profile.experiences[0];
  return [
    "Madame, Monsieur,",
    "",
    `Je postule au poste de ${input.job.title} au sein de ${company}.`,
    exp
      ? `Mon expérience en tant que ${exp.role} chez ${exp.company} m'a préparé à ce défi.`
      : "Mon parcours m'a préparé à ce défi.",
    "",
    "Je reste à votre disposition pour un entretien.",
    "",
    "Cordialement,",
  ].join("\n");
}

export function mockExtractCv(text: string): ProfileData {
  return {
    headline: "Candidat",
    summary: text.slice(0, 240),
    experiences: [],
    skills: [],
    education: [],
  };
}
```

`jobforge/src/lib/ai/client.ts`:

```ts
export async function runWorkersAiPrompt(
  system: string,
  user: string,
): Promise<string> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("CF_ACCOUNT_ID and CF_API_TOKEN are required when AI_MODE=cloudflare");
  }
  const model = "@cf/meta/llama-3.1-8b-instruct";
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Workers AI error: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { result?: { response?: string } };
  return json.result?.response ?? "";
}
```

`jobforge/src/lib/ai/jobs.ts`:

```ts
import { runWorkersAiPrompt } from "./client";
import {
  mockDraftLetter,
  mockExtractCv,
  mockMatchProfile,
  mockParseJob,
} from "./mock";
import type { DraftLetterInput, MatchResult, ParsedJob, ProfileData } from "./types";

function useMock() {
  return (process.env.AI_MODE ?? "mock") !== "cloudflare";
}

export async function parseJob(raw: string): Promise<ParsedJob> {
  if (useMock()) return mockParseJob(raw);
  const response = await runWorkersAiPrompt(
    "Tu extrais une offre d'emploi en JSON {title,company,skills,level,rawSummary}. Pas de markdown. Français.",
    raw,
  );
  return JSON.parse(response) as ParsedJob;
}

export async function matchProfile(
  profile: ProfileData,
  job: ParsedJob,
): Promise<MatchResult> {
  if (useMock()) return mockMatchProfile(profile, job);
  const response = await runWorkersAiPrompt(
    "Tu scores 0-100 le match profil/offre. JSON {score,gaps,suggestedVariantTitle,reasons}. N'invente rien.",
    JSON.stringify({ profile, job }),
  );
  return JSON.parse(response) as MatchResult;
}

export async function draftLetter(input: DraftLetterInput): Promise<string> {
  if (useMock()) return mockDraftLetter(input);
  return runWorkersAiPrompt(
    "Rédige une lettre de motivation FR courte. N'invente aucun employeur ni diplôme absent du profil.",
    JSON.stringify(input),
  );
}

export async function extractCv(text: string): Promise<ProfileData> {
  if (useMock()) return mockExtractCv(text);
  const response = await runWorkersAiPrompt(
    "Extrais un profil JSON {headline,summary,experiences,skills,education}. N'invente rien.",
    text,
  );
  return JSON.parse(response) as ProfileData;
}
```

`jobforge/src/lib/ai/index.ts`:

```ts
export * from "./types";
export { parseJob, matchProfile, draftLetter, extractCv } from "./jobs";
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd jobforge && npm test -- tests/ai-jobs.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add jobforge/src/lib/ai jobforge/tests/ai-jobs.test.ts
git commit -m "feat(jobforge): add Cloudflare AI adapter with mock mode"
```

---

### Task 4: Auth (credentials) + register/login

**Files:**
- Create: `jobforge/src/lib/auth.ts`
- Create: `jobforge/src/app/api/auth/[...nextauth]/route.ts`
- Create: `jobforge/src/app/api/auth/register/route.ts`
- Create: `jobforge/src/app/(auth)/login/page.tsx`
- Create: `jobforge/src/app/(auth)/register/page.tsx`
- Create: `jobforge/tests/register.test.ts`

**Interfaces:**
- Produces: NextAuth session with `user.id`, `user.email`
- Produces: `POST /api/auth/register` `{ email, password, name? }` → `{ id, email }`

- [ ] **Step 1: Write failing register unit test (password hashing helper)**

`jobforge/src/lib/password.ts`:

```ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

`jobforge/tests/register.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("Secret123!");
    expect(hash).not.toBe("Secret123!");
    expect(await verifyPassword("Secret123!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd jobforge && npm test -- tests/register.test.ts
```

Expected: PASS after `password.ts` exists (write file in step 1 together if preferred — keep TDD: write test first without implementation, fail, then add `password.ts`).

- [ ] **Step 3: Implement NextAuth + register route**

Use Auth.js v5 credentials provider validating against `prisma.user`.  
Register route:

```ts
// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
    },
    select: { id: true, email: true },
  });
  return NextResponse.json(user, { status: 201 });
}
```

Wire `src/lib/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts` per Auth.js v5 docs (credentials + JWT session containing `user.id`).

- [ ] **Step 4: Build FR login/register pages**

Minimal forms posting to register API then `signIn("credentials")`. Copy: “Créer un compte”, “Se connecter”, “Email”, “Mot de passe”.

- [ ] **Step 5: Manual check**

```bash
cd jobforge && npm run dev
```

Register at `/register`, login at `/login`, session cookie set.

- [ ] **Step 6: Commit**

```bash
git add jobforge/src/lib/auth.ts jobforge/src/lib/password.ts jobforge/src/app/api/auth jobforge/src/app/(auth) jobforge/tests/register.test.ts
git commit -m "feat(jobforge): add credentials auth and registration"
```

---

### Task 5: Profile create/update API + page

**Files:**
- Create: `jobforge/src/lib/profile-schema.ts`
- Create: `jobforge/src/app/api/profile/route.ts`
- Create: `jobforge/src/app/(app)/profil/page.tsx`
- Create: `jobforge/tests/profile-schema.test.ts`

**Interfaces:**
- Produces: `GET/PUT /api/profile` (auth required)
- Profile `data` matches `ProfileData` from AI types

- [ ] **Step 1: Write schema test**

```ts
import { describe, expect, it } from "vitest";
import { profileDataSchema } from "@/lib/profile-schema";

describe("profileDataSchema", () => {
  it("accepts a minimal valid profile", () => {
    const parsed = profileDataSchema.parse({
      experiences: [],
      skills: ["React"],
      education: [],
    });
    expect(parsed.skills).toEqual(["React"]);
  });

  it("rejects missing skills array", () => {
    expect(() =>
      profileDataSchema.parse({ experiences: [], education: [] }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Implement schema**

```ts
import { z } from "zod";

export const profileDataSchema = z.object({
  headline: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      period: z.string().optional(),
      bullets: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      title: z.string(),
      place: z.string().optional(),
    }),
  ),
});
```

- [ ] **Step 3: Implement GET/PUT `/api/profile`**

- GET: return profile or 404  
- PUT: upsert profile for session user; also ensure a `Variant` with `slug: "default"` exists  

- [ ] **Step 4: Build `/profil` page**

Form FR: titre, résumé, compétences (comma-separated), save button. Load from GET, save via PUT.

- [ ] **Step 5: Test + commit**

```bash
cd jobforge && npm test -- tests/profile-schema.test.ts
git add jobforge/src/lib/profile-schema.ts jobforge/src/app/api/profile jobforge/src/app/(app)/profil jobforge/tests/profile-schema.test.ts
git commit -m "feat(jobforge): add profile API and edit page"
```

---

### Task 6: Vertical slice — paste offer → match → letter

**Files:**
- Create: `jobforge/src/app/api/applications/route.ts`
- Create: `jobforge/src/app/api/applications/[id]/match/route.ts`
- Create: `jobforge/src/app/api/applications/[id]/letter/route.ts`
- Create: `jobforge/src/app/(app)/page.tsx` (home CTA)
- Create: `jobforge/src/app/(app)/candidatures/[id]/page.tsx`
- Create: `jobforge/tests/match-flow.test.ts`

**Interfaces:**
- `POST /api/applications` `{ jobRaw: string }` → `{ id }` status `DRAFT`
- `POST /api/applications/:id/match` → updates score + status `MATCHED`
- `POST /api/applications/:id/letter` → updates letterBody + status `LETTER_READY`

- [ ] **Step 1: Write match-flow unit test using mocks**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { draftLetter, matchProfile, parseJob } from "@/lib/ai";

describe("candidature flow helpers", () => {
  beforeEach(() => {
    process.env.AI_MODE = "mock";
  });

  it("runs parse → match → letter in sequence", async () => {
    const job = await parseJob(
      "Poste: Développeur Full-Stack\nEntreprise: Airtel Congo\nStack: React, Node.js",
    );
    const match = await matchProfile(
      {
        experiences: [
          { role: "Dev", company: "Webtinix", bullets: ["React", "Node"] },
        ],
        skills: ["React", "Node.js"],
        education: [],
      },
      job,
    );
    const letter = await draftLetter({
      profile: {
        experiences: [
          { role: "Dev", company: "Webtinix", bullets: ["React"] },
        ],
        skills: ["React"],
        education: [],
      },
      job,
      variantTitle: match.suggestedVariantTitle,
    });
    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(letter).toContain("Airtel Congo");
  });
});
```

- [ ] **Step 2: Run test — pass with existing AI mocks**

```bash
cd jobforge && npm test -- tests/match-flow.test.ts
```

- [ ] **Step 3: Implement API routes**

`POST /api/applications`: create row with `jobRaw`, status `DRAFT`.  
`POST .../match`: load profile + application, `parseJob` if needed, `matchProfile`, save `jobParsed`, `matchScore`, `matchPayload`, status `MATCHED`.  
`POST .../letter`: `draftLetter`, save `letterBody`, status `LETTER_READY`.

Reject if no profile (400: “Complétez votre profil”).

- [ ] **Step 4: UI home + candidature detail**

Home (`/` under `(app)` layout, auth-gated): textarea “Colle une offre d’emploi”, button “Analyser”.  
Detail page: show score, gaps, letter textarea (editable), buttons “Relancer le match” / “Générer la lettre”.

- [ ] **Step 5: Manual E2E check**

1. Register  
2. Fill profile with React/Node skills  
3. Paste offer mentioning React  
4. See score + letter draft  

- [ ] **Step 6: Commit**

```bash
git add jobforge/src/app jobforge/tests/match-flow.test.ts
git commit -m "feat(jobforge): offer-to-letter vertical slice"
```

---

### Task 7: App shell + README for JobForge

**Files:**
- Create: `jobforge/src/app/(app)/layout.tsx` (nav FR)
- Create: `jobforge/README.md`
- Modify: root `README.md`

- [ ] **Step 1: Add authenticated layout nav**

Links: Accueil, Profil, Candidatures (list later optional), Déconnexion.

- [ ] **Step 2: Write `jobforge/README.md`**

Include: setup AlwaysData `DATABASE_URL`, `AUTH_SECRET`, `AI_MODE=mock|cloudflare`, `npm run dev`, Phase 1 scope / Phase 2 preview.

- [ ] **Step 3: Link from root README**

Short “JobForge (SaaS)” section with path `jobforge/`.

- [ ] **Step 4: Commit**

```bash
git add jobforge/README.md jobforge/src/app/(app)/layout.tsx README.md
git commit -m "docs(jobforge): add Phase 1 README and app shell"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Next + Postgres + CF AI + Vercel | 1–3 |
| Auth | 4 |
| Profil structuré (+ édition) | 5 |
| Offre → match → lettre | 6 |
| UI FR / Congo focus defaults | 4–6 (`countryFocus` default CG) |
| Templates PDF / OAuth send / R2 / annuaire | **Phase 2–3 plans** (explicitly deferred) |
| B2B | Phase 4 (deferred) |

## Placeholder scan

No TBD/TODO left in Phase 1 tasks. Cloudflare live calls optional via `AI_MODE=cloudflare`; tests stay on mock.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-26-jobforge-phase1-foundation.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
