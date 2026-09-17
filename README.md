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
- Requires sign-in (username and password from environment variables) before analysis

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
| `LOGIN_USERNAME` | `analyst` | Workbench sign-in username (backend only) |
| `LOGIN_PASSWORD` | `ChangeMe!2026` | Workbench sign-in password (backend only) |
| `SESSION_SECRET` | *(see `.env.example`)* | Signs the httpOnly session cookie. Change this in any shared environment |
| `MAX_FILES` | `5` | Max files per analysis request |
| `MAX_FILE_BYTES` | `2097152` | Max size per file (2 MB) |
| `AI_PROVIDER` | `mock` | `mock` or `openai` |
| `OPENAI_API_KEY` | *(empty)* | Backend-only. Never sent to the frontend |
| `OPENAI_MODEL` | `gpt-4o-mini` | Used only when `AI_PROVIDER=openai` |

Leave `AI_PROVIDER=mock` for a full local run with no vendor key.

## Login credentials (project setup)

Sign-in is **not** hard-coded in the frontend. The backend reads `LOGIN_USERNAME`, `LOGIN_PASSWORD`, and `SESSION_SECRET` from `.env`.

Default local values (from `.env.example`):

- Username: `analyst`
- Password: `ChangeMe!2026`

Change these before any demo that is not on your own machine. Never commit a real password. The UI never receives `LOGIN_PASSWORD` or `SESSION_SECRET`.

After `copy .env.example .env`, edit those three variables, then start the backend so it picks them up.

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
| API | http://127.0.0.1:3001 |
| Health | `GET http://127.0.0.1:3001/api/v1/health` |
| Analyse | `POST http://127.0.0.1:3001/api/v1/analyze` (multipart: `files`, `instruction`; requires session cookie) |
| Sign in | `POST http://127.0.0.1:3001/api/v1/auth/login` |
| Sign out | `POST http://127.0.0.1:3001/api/v1/auth/logout` |
| Session | `GET http://127.0.0.1:3001/api/v1/auth/me` |

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
| API proxy | Vite proxies `/api` to `http://127.0.0.1:3001` |

Keep the backend running in another terminal. The browser only talks to the frontend origin; analysis requests go through the proxy.

The UI shows a **Sign in** screen first. Use `LOGIN_USERNAME` / `LOGIN_PASSWORD` from `.env`. **Sign out** clears the server session and the httpOnly cookie.

## How to run the complete application from scratch

Use two terminals. PowerShell examples:

**1. Clone and configure**

```powershell
git clone <repository-url>
cd Multi-Document_AI
copy .env.example .env
```

Edit `.env` if your MySQL user or password is not `root` / empty. Also set `LOGIN_USERNAME`, `LOGIN_PASSWORD`, and `SESSION_SECRET` (defaults are listed above).

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
- `API listening on http://127.0.0.1:3001`

`npm run setup:db` is optional if you start the API, because `npm run dev` also creates `multi_doc` and the tables. Running it first makes a failed DB connection obvious before the UI starts.

**4. Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

**5. Sign in**

Use the credentials from `.env` (default `analyst` / `ChangeMe!2026`). A successful login sets an httpOnly session cookie. Analysis routes reject unauthenticated requests.

**6. Run an analysis**

1. Upload two or more files from `samples/` (for example `aurora_lending_application.txt`, `aurora_financials.csv`, `harbour_credit_licence.pdf`).
2. Optionally include `empty.txt` or `corrupt.pdf` to see graceful failure.
3. Enter or pick an instruction, for example: *Identify inconsistencies between the application form and supporting documents.*
4. Click **Run analysis**.
5. Review summary, comparison table, discrepancies, missing information, key-values, and independent per-document findings.
6. Click **Copy output**.
7. Click **Sign out** when finished.

## Architecture

```
Browser (React)
    → POST /api/v1/auth/login  (env credentials, httpOnly signed cookie)
    → POST /api/v1/analyze     (session required)
        → validate instruction and files
        → extract each document independently (PDF / CSV / TXT)
        → AnalysisProvider (mock by default, OpenAI optional)
            → per-document facts
            → collective comparison
        → persist metadata + result JSON in MySQL (multi_doc)
    → structured result envelope { data, error, meta }
    → POST /api/v1/auth/logout
```

Design choices:

- Document processing is separate from analysis.
- `AnalysisProvider` is an interface so the mock can be replaced by an LLM later.
- Shared TypeScript types in `shared/` are the API contract.
- Documents are not concatenated into one prompt. Each file keeps its own id, filename, and locator.
- Uploads are processed in memory (max 5 × 2 MB) rather than using the user filename as a disk path.

Out of scope for this assessment: RAG, vector databases, Docker, Kubernetes, Redis.

## Completed functionality

The brief is covered:

- Multiple-file upload with at least two formats (this repo supports **PDF, CSV, and TXT**)
- Extract/ingest per document
- User-defined analysis instruction
- Independent and collective analysis without merging documents into one prompt
- Structured comparison table, consolidated summary, discrepancies, missing-information report, and key-value extraction
- Source document on every finding
- Copyable generated output
- Graceful handling of unsupported, unreadable, empty, and invalid files
- Synthetic sample documents only
- TypeScript frontend and backend, MySQL, modular extractors, mock (or optional LLM) analysis, provenance, validation, and tests

## Additional features (beyond the assessment brief)

These are **not required** by the 60-minute specification. They were added on top of a working workbench.

| Additional feature | Why it is extra |
|---|---|
| **Sign-in and sign-out** | The brief does not ask for authentication. The app uses `LOGIN_USERNAME` / `LOGIN_PASSWORD` from `.env`, a signed httpOnly session cookie, and rejects unauthenticated `/analyze` calls. |
| **Session security extras** | Timing-safe credential compare, generic login errors, login rate limit, `SameSite` cookie, `Secure` in production, security response headers. |
| **Automatic MySQL bootstrap** | The brief only needs a schema/seed where applicable. On start the API creates database `multi_doc` and tables without a manual SQL step. |
| **Three document formats** | The brief requires at least two. PDF, CSV, and TXT are all implemented. |
| **All result views at once** | The brief allows *one or more* output types. The UI always shows summary, comparison table, discrepancies, missing information, key-values, **and** a per-document independent analysis panel. |
| **Example instruction chips** | Clickable sample prompts in the UI (the brief only requires a user-defined instruction). |
| **Optional OpenAI provider** | A mock AI satisfies the brief. `AnalysisProvider` can be switched to OpenAI via `AI_PROVIDER` without changing the pipeline. |
| **Health and saved-analysis APIs** | `GET /api/v1/health` and `GET /api/v1/analyses/:id` (owner-scoped) are extra operational endpoints. |
| **Analyse rate limiting** | In-process limit on analysis requests, in addition to login throttling. |
| **Shared API types + envelope** | `shared/` TypeScript contracts and `{ data, error, meta }` on every response. |
| **Large-content truncation flag** | Extracted text is capped; the UI marks truncated documents. |
| **React error boundary** | Unexpected UI failures show a safe message instead of a blank page. |
| **Frontend and backend test suites** | The brief requires *at least one* meaningful test. This repo has backend tests (pipeline, auth, API) and frontend tests (validation, results, copy output). |
| **Corrupt/empty sample files** | `empty.txt` and `corrupt.pdf` exist specifically to demonstrate graceful failure. |
| **Cursor project rules** | `.cursor/rules` encode engineering constraints for the coding agent; not part of the product brief. |

Login, CORS, rate limits, and env-based credentials are therefore **additional**. The core upload → extract → analyse → structured, sourced results flow is what the assessment asked for.

## Assumptions

- A single env-configured workbench user is enough for this assessment; it is not SSO or multi-tenant IAM.
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
- Demo login is a single env user, not SSO / case-level authorisation.
- Login password is compared from `.env` (not a password-hash user store).

## Security considerations

- API keys, database credentials, and login credentials stay on the backend and in `.env` (gitignored).
- Login uses Zod validation, generic failure messages, timing-safe credential compare, login rate limits, and no password in responses.
- Sessions are random ids in signed **httpOnly** cookies (`SameSite=lax`, `Secure` in production). Analysis APIs require that session. The client cannot set `user_id`.
- Parameterized MySQL queries; analysis reads are scoped by `id` and `user_id` (the signed-in username).
- CORS is an explicit frontend origin with credentials, not `*`.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`; `X-Powered-By` disabled.
- Upload allowlist, payload size limits, and in-memory multipart handling.
- Generic client error messages; details stay in server logs.
- User instructions and document text are untrusted. The mock does not follow override-like language in the instruction.
- No real customer/banking documents. Source financial values are not rewritten.
- Full document content is not stored in MySQL.
- Responses return structured findings and statuses, not secrets, stack traces, or raw SQL.

## Testing + how to run tests

### Backend

Node.js test runner. Covers independent/collective analysis with source ids, upload validation, extractors, login/logout, and authz on `/api/v1/analyze`.

```powershell
cd backend
npm test
```

### Frontend

Vitest + React Testing Library. Covers file validation, login field checks, copyable output, results rendering (comparison, discrepancies, provenance, fact vs interpretation), and the submit guard.

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

- Replace the demo env-user login with real authentication and per-case authorisation.
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
- Login/session, rate limits, and extra tests were added beyond the written brief (see **Additional features**)

## Clear commit history

The repository should be submitted with small, reviewable commits that separate scaffolding, backend pipeline, frontend workbench, samples/docs, and tests. Do not commit `.env`, `node_modules`, or secrets.

Suggested history shape:

1. Project structure, `.env.example`, and Cursor rules
2. Shared types and backend API / extractors / mock analysis / MySQL bootstrap
3. React workbench and copyable results
4. Synthetic samples and README
5. Frontend and backend automated tests
