# AI Cloud Architect

Describe your app in plain English → get 3 AWS architecture options, a recommendation, a live Mermaid diagram, and cost/security/scalability analysis.

See [prd.md](./prd.md) for the full product requirements. **Phase 1 (MVP)** is in progress.

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
    llm.py             LLM client (Gemini) + schema-enforced generation with self-heal
    llm_errors.py      LLMError → contract 502 body
    mermaid_validator.py  Server-side Mermaid validation (Node parser + heuristic fallback)
    logging_config.py  Structured JSON logs + request-id context
    prompts/           Prompt templates per endpoint (extract/options/diagram/analyse/chat)
    routers/architect.py  Endpoint handlers (stub or live per ARCHITECT_MODE)
  tests/test_contract.py     Contract tests (always run in stub mode)
  tests/test_mermaid_validator.py
  tests/test_live_smoke.py   End-to-end test against the real LLM (opt-in)
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

Phase 1 uses **Gemini** (default model `gemini-3.6-flash`, a pinned free-tier model that is
less prone to 503 "high demand" errors than the `*-latest` aliases, which route to the
newest/overloaded model;
set `ARCHITECT_LARGE_MODEL=gemini-pro-latest` once billing is enabled for the Pro tier).
Copy `.env.example` to `.env` and set your key, then restart the backend:

```bash
cp .env.example .env      # set GEMINI_API_KEY, ARCHITECT_MODE=live
.venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend
```

`/api/health` reports the active mode (`stub` or `live`). The provider is selected via
`ARCHITECT_LLM_PROVIDER` behind a small client interface (`backend/app/llm.py`), so a
local Ollama backend can be added later without touching the routes.

> **Free-tier quota:** the Gemini free tier allows ~20 requests/day per model. One full
> user flow (generate → select → chat) uses 5 requests. Enable billing on the Google AI
> account for serious use; transient 429/503s are retried automatically.

> **PRD deviation:** the PRD targets local-only inference via Ollama (§3, §7 privacy NFR).
> Phase 1 uses Gemini for speed of delivery; prompts are sent to the Gemini API. The
> provider abstraction keeps the Ollama swap a config-level change.

## Quickstart (Docker)

```bash
docker compose up --build
```

Live mode in Docker: put `ARCHITECT_MODE=live` and `GEMINI_API_KEY` in `.env` at the repo
root (picked up via `env_file`) or export them in your shell.

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
| `ARCHITECT_LLM_PROVIDER` | `gemini` | LLM provider (only `gemini` implemented) |
| `GEMINI_API_KEY` | — | Required in live mode |
| `ARCHITECT_LARGE_MODEL` | `gemini-flash-latest` | Model for all generation steps |
| `ARCHITECT_LLM_TIMEOUT` | `120` | Per-call timeout (seconds) |
| `ARCHITECT_LLM_MAX_RETRIES` | `2` | Self-heal retries on schema/mermaid validation failure |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL for the frontend |
