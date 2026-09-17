# Multi-Document Intelligence Workbench

## What the project does

A banking-domain document review workbench. A user uploads multiple **synthetic** application and supporting files (PDF, CSV, TXT), enters a custom analysis instruction, and receives structured findings.

The application:

- Extracts content from each document independently
- Analyses documents independently and then collectively, without merging them into one unstructured prompt
- Preserves document provenance on every finding
- Distinguishes extracted facts from AI interpretation
- Reports discrepancies, missing information, and key-value fields
- Handles unsupported, unreadable, empty, and invalid files without failing the whole run
- Lets the user copy the generated output

Stack: **React**, **Node.js**, **TypeScript** (frontend and backend), **MySQL**. Database name: `multi_doc`.

No real customer or banking data is used.

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MySQL 8 listening on `127.0.0.1:3306`
- Git

Default local MySQL credentials in `.env.example` are `root` with an empty password. Change them in `.env` if your instance differs.

## Repository structure

```
Multi-Document_AI/
├── frontend/                 # React + Vite + TypeScript UI
│   └── src/
├── backend/                  # Node.js + Express + TypeScript API
│   └── src/
│       ├── ai/               # Pluggable analysis provider (mock / optional OpenAI)
│       ├── db/               # MySQL pool, schema bootstrap, persistence
│       ├── extractors/       # PDF, CSV, TXT pipeline
│       ├── middleware/       # Errors, rate limit, request id
│       ├── routes/           # /api/v1 HTTP routes
│       ├── services/         # Analysis orchestration
│       └── validation/       # Instruction and file validation
├── shared/                   # Shared TypeScript API and domain types
├── samples/                  # Synthetic PDF / CSV / TXT only
├── .cursor/rules/            # Cursor project rules used during development
├── .env.example              # Template for local configuration (no secrets)
└── README.md
```

Frontend never talks to MySQL or the LLM provider. The UI calls `/api/v1` only.

## Environment variables

Copy the example file. Do **not** commit `.env`.

```powershell
copy .env.example .env
```

The backend loads `.env` from the repository root (or `backend/.env` if present).

## Environment configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Backend HTTP port |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowlist (exact origin) |
| `NODE_ENV` | `development` | Runtime mode |
| `MYSQL_HOST` | `127.0.0.1` | MySQL host |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | `root` | MySQL user |
| `MYSQL_PASSWORD` | *(empty)* | MySQL password |
| `MYSQL_DATABASE` | `multi_doc` | Database name (created automatically) |
| `MAX_FILES` | `5` | Max files per analysis request |
| `MAX_FILE_BYTES` | `2097152` | Max size per file (2 MB) |
| `AI_PROVIDER` | `mock` | `mock` or `openai` |
| `OPENAI_API_KEY` | *(empty)* | Backend-only. Never sent to the frontend |
| `OPENAI_MODEL` | `gpt-4o-mini` | Used only when `AI_PROVIDER=openai` |

Leave `AI_PROVIDER=mock` for a full local run with no vendor key.

## Database setup

You do **not** need to run SQL by hand.

On backend start, the API:

1. Connects to MySQL with `MYSQL_*` values
2. Creates database `multi_doc` if it does not exist
3. Creates tables `analyses` and `documents` if they do not exist

Optional explicit bootstrap (same result, without starting the HTTP server):

```powershell
cd backend
npm install
npm run setup:db
```

Reference schema (already applied by the app): `backend/src/db/schema.sql`.

Tables:

- `analyses` — analysis id, `user_id`, instruction, structured `result_json`
- `documents` — per-file metadata and status, scoped by `user_id` and `analysis_id`

Original file bytes and full document text are **not** stored.

## Backend setup

```powershell
cd backend
npm install
npm run samples
npm run setup:db
npm test
npm run dev
```

| Item | Value |
|---|---|
| API | http://localhost:3001 |
| Health | `GET http://localhost:3001/api/v1/health` |
| Analyse | `POST http://localhost:3001/api/v1/analyze` (multipart: `files`, `instruction`) |

`npm run samples` writes `samples/harbour_credit_licence.pdf` and `samples/corrupt.pdf`.

## Frontend setup

```powershell
cd frontend
npm install
npm test
npm run dev
```

| Item | Value |
|---|---|
| UI | http://localhost:5173 |
| API proxy | Vite proxies `/api` to `http://localhost:3001` |

Keep the backend running in another terminal. The browser only talks to the frontend origin; analysis requests go through the proxy.

## How to run the complete application from scratch

Use two terminals. PowerShell examples:

**1. Clone and configure**

```powershell
git clone <repository-url>
cd Multi-Document_AI
copy .env.example .env
```

Edit `.env` if your MySQL user or password is not `root` / empty.

**2. Confirm MySQL is running** on port 3306.

**3. Database + backend**

```powershell
cd backend
npm install
npm run samples
npm run setup:db
npm run dev
```

Wait until you see:

- `MySQL database 'multi_doc' is ready`
- `API listening on http://localhost:3001`

`npm run setup:db` is optional if you start the API, because `npm run dev` also creates `multi_doc` and the tables. Running it first makes a failed DB connection obvious before the UI starts.

**4. Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

**5. Run an analysis**

1. Upload two or more files from `samples/` (for example `aurora_lending_application.txt`, `aurora_financials.csv`, `harbour_credit_licence.pdf`).
2. Optionally include `empty.txt` or `corrupt.pdf` to see graceful failure.
3. Enter or pick an instruction, for example: *Identify inconsistencies between the application form and supporting documents.*
4. Click **Run analysis**.
5. Review summary, comparison table, discrepancies, missing information, key-values, and independent per-document findings.
6. Click **Copy output**.

## Architecture

```
Browser (React)
    → POST /api/v1/analyze
        → validate instruction and files
        → extract each document independently (PDF / CSV / TXT)
        → AnalysisProvider (mock by default, OpenAI optional)
            → per-document facts
            → collective comparison
        → persist metadata + result JSON in MySQL (multi_doc)
    → structured result envelope { data, error, meta }
```

Design choices:

- Document processing is separate from analysis.
- `AnalysisProvider` is an interface so the mock can be replaced by an LLM later.
- Shared TypeScript types in `shared/` are the API contract.
- Documents are not concatenated into one prompt. Each file keeps its own id, filename, and locator.
- Uploads are processed in memory (max 5 × 2 MB) rather than using the user filename as a disk path.

Out of scope for this assessment: RAG, vector databases, Docker, Kubernetes, Redis.

## Completed functionality

- Multiple-file upload with PDF, CSV, and TXT support
- File validation: count, size, extension, MIME, empty/corrupt/unsupported handling
- User-defined analysis instruction (treated as untrusted input)
- Independent document analysis and collective comparison
- Structured output: consolidated summary, comparison table, discrepancy list, missing-information report, key-value extraction
- Source document indicated on each finding
- Facts labelled separately from interpretation
- Copyable generated output
- Frontend/backend separation with TypeScript on both sides
- MySQL persistence of analysis JSON and document metadata
- Pluggable mock AI (optional OpenAI path)
- Automated tests on frontend and backend

## Assumptions

- A demo `x-user-id` header (default `demo-user`) is enough for this assessment; it is not a full identity platform.
- In-memory upload processing is appropriate for the 2 MB × 5 file limit.
- A deterministic mock extractor is acceptable when no LLM key is provided.
- Sample names, addresses, licences, revenue, and obligations are fictional.
- Labelled fields in sample documents (`Company name:`, `Revenue:`, CSV `field,value`) are the extraction contract for the mock.

## Known limitations

- Mock extraction is weaker on unstructured prose than on labelled fields.
- Image OCR is not implemented (PDF, CSV, and TXT only).
- Rate limiting is in-process (lost on process restart; not Redis).
- Analysis runs inside the HTTP request; there is no job queue.
- Optional OpenAI path needs a key and is not required for the demo.
- Demo user scoping is not SSO / case-level authorisation.

## Security considerations

- API keys and database credentials stay on the backend and in `.env` (gitignored).
- Parameterized MySQL queries; analysis reads are scoped by `id` and `user_id`.
- CORS is an explicit frontend origin, not `*`.
- Upload allowlist, payload size limits, and in-memory multipart handling.
- Generic client error messages; details stay in server logs.
- User instructions and document text are untrusted. The mock does not follow override-like language in the instruction.
- No real customer/banking documents. Source financial values are not rewritten.
- Full document content is not stored in MySQL.
- Responses return structured findings and statuses, not secrets, stack traces, or raw SQL.

## Testing + how to run tests

### Backend

Node.js test runner. Covers independent/collective analysis with source ids, upload validation, extractors, and the `/api/v1/analyze` error envelope.

```powershell
cd backend
npm test
```

### Frontend

Vitest + React Testing Library. Covers file validation, copyable output, results rendering (comparison, discrepancies, provenance, fact vs interpretation), and the submit guard.

```powershell
cd frontend
npm test
```

Watch mode:

```powershell
cd frontend
npm run test:watch
```

## Synthetic sample documents

All files in `samples/` are synthetic. Do not add real customer or banking documents.

| File | Role |
|---|---|
| `aurora_lending_application.txt` | Lending application (identity, licence, revenue, obligation) |
| `aurora_financials.csv` | Supporting financials with conflicting address and revenue |
| `harbour_credit_licence.pdf` | Supporting licence extract for another entity (generated) |
| `harbour_credit_licence.txt` | Text equivalent of the licence extract |
| `empty.txt` | Empty-file status |
| `corrupt.pdf` | Unreadable PDF status |

Generate the PDFs:

```powershell
cd backend
npm run samples
```

Example instructions:

- Compare the information across all uploaded documents.
- Identify inconsistencies between the application form and supporting documents.
- Extract key dates, obligations, financial values, and missing information.
- Compare the financial position of the companies represented in the documents.
- Highlight discrepancies in names, addresses, licence details, or revenue figures.

## Productionisation approach

- Replace `x-user-id` with real authentication and per-case authorisation.
- Point `AnalysisProvider` at a production LLM; keep structured-output validation.
- Store uploads in encrypted object storage with malware scanning and retention/deletion.
- Use a secret manager for MySQL and provider credentials.
- HTTPS only; durable rate limiting and structured audit logs.
- Keep a human reviewer in the loop. Never treat model output as a credit decision.
- Add background jobs for large documents; keep document boundaries in every AI request.

## AI tool disclosure

AI tools used during this assessment:

- **Cursor** — used as the development environment and for the coding **agent**. The agent implemented the workbench against project rules in `.cursor/rules` (React/Node TypeScript, API and file security, mock analysis provider, and the document pipeline).
- **ChatGPT** — used for content search and analysis: clarifying the banking assessment requirements, comparing expected output formats, and checking that the README and design covered provenance, facts vs interpretation, and graceful document handling.

Architectural and implementation decisions made by the candidate include:

- 60-minute scope: no RAG, vector DB, Docker, Kubernetes, or Redis
- Mock `AnalysisProvider` as the default, with a typed swap path to an LLM
- Shared TypeScript types as the API contract
- Persist structured results and metadata only, not original bytes
- Automatic MySQL `multi_doc` bootstrap instead of a manual SQL step

## Clear commit history

The repository should be submitted with small, reviewable commits that separate scaffolding, backend pipeline, frontend workbench, samples/docs, and tests. Do not commit `.env`, `node_modules`, or secrets.

Suggested history shape:

1. Project structure, `.env.example`, and Cursor rules
2. Shared types and backend API / extractors / mock analysis / MySQL bootstrap
3. React workbench and copyable results
4. Synthetic samples and README
5. Frontend and backend automated tests
