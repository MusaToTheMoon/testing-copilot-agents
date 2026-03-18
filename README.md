# EssayAI — AI-Powered Essay Writing Platform

A full-stack monorepo application that guides users through every stage of academic essay writing using AI assistance.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Zustand
- **Backend**: Express.js, TypeScript, Zod validation
- **Database**: PostgreSQL via Prisma ORM
- **AI**: OpenAI GPT-4o (with mock mode when no API key is set)
- **Auth**: JWT via httpOnly cookies

---

## Project Structure

```
/
├── apps/
│   ├── web/          # Next.js 14 frontend (port 3000)
│   └── api/          # Express API gateway (port 3001)
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── db/           # Prisma schema + client
│   ├── word-tools/   # Word count & budget logic
│   ├── llm/          # LLM provider adapters
│   └── workflow/     # Essay stage state machine
└── package.json      # Root workspace config
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- PostgreSQL (or set `DATABASE_URL` to any Postgres instance)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values
```

Key variables in `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/essay_app
JWT_SECRET=your-secret-key

# LLM — leave blank to use mock mode (no API key needed)
OPENAI_API_KEY=
```

### 3. Set up the database

```bash
cd packages/db
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema to database
```

### 4. Build shared packages

```bash
pnpm --filter './packages/*' build
```

### 5. Run in development

```bash
# Run both API and web concurrently
pnpm dev

# Or individually:
pnpm --filter @essay-app/api dev    # http://localhost:3001
pnpm --filter @essay-app/web dev    # http://localhost:3000
```

---

## Essay Writing Workflow

The application guides users through these stages:

```
CREATED → RESEARCHING → SOURCES_APPROVED → THESIS_DRAFTED → THESIS_APPROVED
→ OUTLINE_DRAFTED → OUTLINE_APPROVED → DRAFTING → REVISING → READY_TO_EXPORT → EXPORTED
```

### Stages

| Stage | Description |
|-------|-------------|
| Research | AI searches for relevant sources; user approves/rejects |
| Thesis | AI generates thesis statement with arguments; user approves |
| Outline | AI creates section-by-section outline with word budgets |
| Draft | AI drafts each section individually with word count tracking |
| Revision | AI performs structure, style, and citation revision passes |
| Export | Download as DOCX or PDF |

---

## API Endpoints

### Auth
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Projects
```
POST  /api/projects
GET   /api/projects/:id
PATCH /api/projects/:id
GET   /api/projects/:id/history
```

### Research
```
POST   /api/projects/:id/research/search
POST   /api/projects/:id/research/upload
POST   /api/projects/:id/research/approve-source
DELETE /api/projects/:id/research/source/:sourceId
```

### Thesis
```
POST /api/projects/:id/thesis/generate
POST /api/projects/:id/thesis/approve
```

### Outline
```
POST /api/projects/:id/outline/generate
POST /api/projects/:id/outline/approve
```

### Drafts
```
POST  /api/projects/:id/drafts/section/:sectionId/generate
PATCH /api/projects/:id/drafts/section/:sectionId
POST  /api/projects/:id/drafts/assemble
```

### Revision
```
POST /api/projects/:id/revision/structure
POST /api/projects/:id/revision/style
POST /api/projects/:id/revision/citations
POST /api/projects/:id/revision/word-budget
POST /api/projects/:id/revision/approve
```

### Word Count
```
POST /api/projects/:id/word-count
POST /api/projects/:id/word-budget/recalculate
```

### Export
```
POST /api/projects/:id/export/docx
POST /api/projects/:id/export/pdf
```

### Feedback
```
GET   /api/projects/:id/comments
POST  /api/projects/:id/comments
PATCH /api/projects/:id/comments/:commentId
POST  /api/projects/:id/comments/regenerate
```

---

## Mock Mode

When `OPENAI_API_KEY` is not set, the API automatically uses mock responses. This allows full UI testing without LLM costs. Mock responses are defined in `apps/api/src/services/llm.ts`.

---

## Running Tests

```bash
pnpm test

# Or just word-tools (pure logic, no DB):
pnpm --filter @essay-app/word-tools test
```

---

## Building for Production

```bash
pnpm build
```

This builds packages in dependency order, then apps.
