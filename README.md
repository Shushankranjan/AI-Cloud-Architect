# AI Cloud Architect

> **Describe your app. Get a production-ready cloud architecture in minutes.**

Describe your app in plain English → get 3 AWS architecture options, a recommendation, a live Mermaid diagram, and cost/security/scalability analysis.

See [prd.md](./prd.md) for the full product requirements. **Phase 1 (MVP)** is in progress.

## Why this project?

Choosing between AWS services (Lambda vs Fargate vs EC2, DynamoDB vs RDS, ...) is hard for startups and solo developers, and architecture diagrams and rationale are rarely written down. AI Cloud Architect guides you from a plain-English description to a compared, explained and documented architecture.

## Features

- **Requirements input** — free text plus optional fields (app type, users, data sensitivity, budget, compliance, region) and example prompts.
- **Constraint extraction** — traffic, data type, latency, compliance, budget and region, with the assumptions the AI made shown to you.
- **3 architecture options** — serverless, container and traditional, each with services, trade-offs and a cost range, plus a recommendation and why the others were rejected.
- **Validated Mermaid diagram** — checked by the real Mermaid parser on the server and auto-repaired by the LLM if invalid.
- **Cost, security and scalability analysis** for the selected option.
- **AI Architect chat** — ask "what if" questions and get structured change proposals.
- **Refine and export** — change the requirements to regenerate; export Markdown, Mermaid or JSON.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Mermaid.js |
| Backend | Python 3.11+, FastAPI, Pydantic |
| LLM | OpenRouter (any hosted model) or Google Gemini, behind a provider interface |
| Contract | OpenAPI 3.1 + JSON fixtures + shared TypeScript types |
| Tooling | pytest, Docker Compose |

## Screenshots

Captured from the running app in stub mode using the "B2B SaaS with GDPR" example.

### 1. Describe your app

Free-text requirements, optional structured fields and ready-made examples.

![Requirements form](docs/screenshots/01-requirements-form.png)
![Example prompt loaded](docs/screenshots/02-example-loaded.png)

### 2. AI analyses the requirements

![Generating](docs/screenshots/03-generating.png)

### 3. Compare three architecture options

Extracted constraints, an AI recommendation with reasoning, and three options.

![Options comparison](docs/screenshots/04-options-comparison.png)
![Option details](docs/screenshots/05-option-details.png)

### 4. Architecture diagram

A Mermaid diagram validated on the server before it is shown.

![Architecture diagram](docs/screenshots/06-architecture-diagram.png)

### 5. Cost, security and scalability analysis

| Cost | Security | Scalability |
|---|---|---|
| ![Cost](docs/screenshots/07-cost-analysis.png) | ![Security](docs/screenshots/08-security-analysis.png) | ![Scalability](docs/screenshots/09-scalability-analysis.png) |

### 6. AI Architect chat

Ask questions and get structured change proposals.

<img src="docs/screenshots/10-architect-chat.png" alt="Architect chat" width="400">

## Repo layout

```
contract/            THE CONTRACT — source of truth for frontend + backend
  openapi.yaml         OpenAPI 3.1 spec (all endpoints + schemas)
  fixtures/            Realistic mock responses (the stub backend serves these)
  types/api.ts         TypeScript types matching the spec
backend/             FastAPI backend (Python 3.11+)
  app/
    main.py            App + CORS + error handlers + request logging
    schemas.py         Pydantic models (Python side of the contract)
    fixtures.py        Fixture loader + in-memory session store
    llm.py             LLM clients (OpenRouter, Gemini) + schema-enforced generation with self-heal
    llm_errors.py      LLMError → contract 502 body
    mermaid_validator.py  Server-side Mermaid validation (Node parser + heuristic fallback)
    logging_config.py  Structured JSON logs + request-id context
    prompts/           Prompt templates per endpoint (extract/options/diagram/analyse/chat)
    routers/architect.py  Endpoint handlers (stub or live per ARCHITECT_MODE)
  tests/test_contract.py     Contract tests (always run in stub mode)
  tests/test_mermaid_validator.py
  tests/test_live_smoke.py   End-to-end test against the real LLM (opt-in)
docs/screenshots/    Screenshots used in this README
frontend/            Next.js 16 (App Router, TypeScript, Tailwind)
  src/lib/types.ts     Contract types (copy of contract/types/api.ts)
  src/lib/api.ts       Typed API client
  src/components/      ArchitectFlow, RequirementsForm, OptionsScreen, WorkspaceScreen,
                       MermaidDiagram, AnalysisTabs, ChatPanel, ...
  scripts/validate-mermaid.mjs  Validates fixture diagrams (also used by the backend)
```

## The contract-first workflow

1. **Contract** (`contract/`) defines every endpoint, request, response, and error shape.
2. **Backend stub** returns fixtures through the real endpoints — no LLM needed.
3. **Frontend** builds against the stub with real `fetch` calls and typed models.
4. With `ARCHITECT_MODE=live`, the same handlers call the LLM provider **without changing the contract**.

If a shape needs to change: update `openapi.yaml` first, then fixtures, then both sides.

## Quickstart (local, no Docker)

Backend:

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt pytest httpx
.venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend
```

Frontend (second terminal):

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Open http://localhost:3000 — the full flow (generate → compare → select → diagram →
chat → refine → export) runs against the stub.

## Live mode (real LLM)

Phase 1 defaults to **OpenRouter** (works with any hosted model — pick a free Gemini
or Llama model to start). Set `ARCHITECT_LLM_PROVIDER=gemini` in `.env` to use the
native Gemini SDK instead (slightly better JSON-schema enforcement).
Copy `.env.example` to `.env` and set your key, then restart the backend:

```bash
cp .env.example .env      # set OPENROUTER_API_KEY (or GEMINI_API_KEY), ARCHITECT_MODE=live
.venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend
```

`/api/health` reports the active mode (`stub` or `live`). The provider is selected via
`ARCHITECT_LLM_PROVIDER` behind a small client interface (`backend/app/llm.py`), so a
local Ollama backend can be added later without touching the routes.

> **Model pick:** OpenRouter needs a model that supports JSON mode
> (`response_format: json_object`). Good defaults:
> `google/gemini-2.5-flash` (cheap, fast), `google/gemini-2.5-pro` (stronger),
> `meta-llama/llama-3.3-70b-instruct:free` (free tier).
>
> **Quota:** OpenRouter is pay-as-you-go; many models have a free tier but rate-limit
> aggressively. One full user flow (generate → select → chat) uses 5 requests.
> Transient 429/503/524 are retried automatically by the OpenRouter client.

> **PRD deviation:** the PRD targets local-only inference via Ollama (§3, §7 privacy NFR).
> Phase 1 uses OpenRouter/Gemini for speed of delivery; prompts are sent to the provider's
> API. The provider abstraction keeps the Ollama swap a config-level change.

## Quickstart (Docker)

```bash
docker compose up --build
```

Live mode in Docker: put `ARCHITECT_MODE=live` and `OPENROUTER_API_KEY` (or
`GEMINI_API_KEY`) in `.env` at the repo root (picked up via `env_file`) or export
them in your shell.

## Verification commands

```bash
# Backend contract tests (stub mode, no LLM needed)
.venv/bin/python -m pytest backend/tests -v

# Fixture Mermaid diagrams are valid
cd frontend && npm run validate:fixtures

# Frontend builds
cd frontend && npm run build

# End-to-end against the real LLM (opt-in; consumes real API quota, takes minutes)
ARCHITECT_LIVE_TESTS=1 .venv/bin/python -m pytest backend/tests/test_live_smoke.py -v -s
```

## API summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + mode (`stub`/`live`) |
| GET | `/api/architect/examples` | Example prompts |
| POST | `/api/architect/generate` | Requirements → constraints + 3 options + recommendation |
| GET | `/api/architect/session/{id}` | Full session state |
| POST | `/api/architect/select` | Pick option → diagram + analysis |
| POST | `/api/architect/chat` | Ask the architect; may return proposed changes |
| POST | `/api/architect/refine` | Modify requirements → regenerate (version bump) |
| POST | `/api/architect/export` | Export markdown / mermaid / json |

Interactive docs: http://localhost:8000/docs

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `ARCHITECT_MODE` | `stub` | `stub` = fixtures, `live` = real LLM |
| `ARCHITECT_LLM_PROVIDER` | `openrouter` | LLM provider (`openrouter` or `gemini`) |
| `OPENROUTER_API_KEY` | — | Required when provider=openrouter |
| `GEMINI_API_KEY` | — | Required when provider=gemini |
| `ARCHITECT_LARGE_MODEL` | `google/gemini-2.5-flash` | Model for all generation steps |
| `ARCHITECT_LLM_TIMEOUT` | `120` | Per-call timeout (seconds) |
| `ARCHITECT_LLM_MAX_RETRIES` | `2` | Self-heal retries on schema/mermaid validation failure |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL for the frontend |
