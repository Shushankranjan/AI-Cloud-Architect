# AI Cloud Architect — Product Requirements Document (PRD)

> **Status:** Draft v1.0
> **Owner:** Product
> **Last updated:** 2026-08-13

---

## 1. Product Overview

**AI Cloud Architect** is an AI-powered web application that helps startups and solo developers design, visualize, and validate cloud architectures through a conversational, guided flow. Users describe their project requirements in natural language, and the AI generates multiple architecture options, recommended designs, live diagrams, and analysis on cost, security, and scalability.

**Tagline:** *"Describe your app. Get a production-ready cloud architecture in minutes."*

### Why now?
Cloud platforms (AWS, Azure, GCP) offer hundreds of services with overlapping capabilities. Startups moving from idea to production often stall at the infrastructure layer because the decision space is too large for a small team to navigate confidently. AI Cloud Architect collapses weeks of architecture work into minutes.

---

## 2. Problem Statement

Startups and solo developers face three core blockers when moving from idea to production:

1. **Knowledge gap** — Cloud services are vast; choosing the right AWS service (RDS vs DynamoDB, ECS vs Lambda, ALB vs API Gateway) requires expertise most early-stage builders lack.
2. **Decision paralysis** — Even when options are known, comparing tradeoffs (cost vs scalability vs security) is time-consuming.
3. **Documentation overhead** — Architecture diagrams and rationale documents are crucial for hiring, fundraising, and onboarding, but rarely produced by lean teams.

Existing tools (AWS Well-Architected Tool, Lucidchart, raw IaC generators) either require deep prior knowledge or are too manual and produce no rationale.

---

## 3. Goals & Non-Goals

### Goals
- Guide non-experts from a plain-English requirement to a deployable AWS architecture.
- Produce **3 ranked architecture options** with clear tradeoffs.
- Generate **interactive Mermaid diagrams** the user can edit.
- Provide **cost, security, and scalability insight** for each option.
- Enable iterative refinement via an **AI Architect Chat**.
- Be **self-hostable** (open-source LLM via Ollama, no vendor lock-in, no data leaves the user's infrastructure).

### Non-Goals (Phase 1)
- Multi-cloud support beyond AWS (Azure/GCP come in Phase 2).
- Real-time pricing API integration.
- Generating Terraform/CloudFormation code (Phase 3).
- Team collaboration / multi-user accounts (Phase 3).
- Fully automated deployment.

---

## 4. Target Users & Personas

### Primary Persona — "Solo SaaS Founder"
- Building a B2B SaaS MVP, working alone or with 1–2 co-founders.
- Limited cloud experience; has used AWS console a few times.
- Needs to make smart infrastructure decisions *before* paying for a CTO.
- Time-poor; values opinionated recommendations.

### Secondary Persona — "Early-Stage Startup Developer"
- A backend/full-stack developer at a seed-stage startup.
- Comfortable with code but not with cloud architecture patterns.
- Wants a "second opinion" before committing to a design.
- Often the only technical hire; needs to justify choices to non-technical co-founders.

### Tertiary Persona — "Indie Hacker / Bootstrapped Builder"
- Shipping a side project or micro-SaaS solo.
- Wants the cheapest viable architecture that won't fall over at 1,000 users.
- Cares most about cost estimates and "what breaks at scale".

---

## 5. User Flow

```
Enter project requirements
        ↓
AI analyzes requirements
        ↓
Extract technical constraints (traffic, data, compliance, budget)
        ↓
Generate 3 architecture options
        ↓
Compare architectures (side-by-side)
        ↓
AI recommends best option (with rationale)
        ↓
User selects architecture
        ↓
Generate architecture diagram (Mermaid)
        ↓
Cost + security + scalability analysis
        ↓
AI Architect Chat (refinement loop)
        ↓
Modify requirements → Architecture updated
        ↓
Finalize architecture
```

---

## 6. Functional Requirements

### FR-1: Requirements Input
- Free-text input box with character/word counter.
- Optional structured fields: app type (API/web/mobile/IoT/data-pipeline), expected users, data sensitivity (none/PII/financial/health), monthly budget tier (<$50 / $50–$500 / $500–$5k / >$5k), compliance needs (none/GDPR/HIPAA/PCI).
- Pre-loaded example prompts (e.g., *"B2B SaaS for 5,000 users in EU with GDPR"*) to onboard new users.

### FR-2: Constraint Extraction
- LLM parses free-text + structured fields into a canonical constraint object:
  - Traffic profile: low / medium / high / very-high
  - Data type: relational / document / blob / stream / mixed
  - Latency sensitivity: relaxed / standard / real-time
  - Compliance: GDPR / HIPAA / PCI / SOC2 / none
  - Budget tier
  - Region preference (if mentioned)
- Returns confidence flags for ambiguous or missing constraints.

### FR-3: Architecture Generation
- Generate **3 distinct options** spanning different paradigms (e.g., *Serverless-first*, *Container-based*, *Traditional EC2/RDS*).
- Each option returns:
  - Ordered list of AWS services with role descriptions
  - Brief rationale (2–3 sentences)
  - Key tradeoffs (3–5 bullets: pros, cons, "best when")

### FR-4: Comparison View
- Side-by-side table with columns:
  - Services used
  - Estimated monthly cost
  - Operational complexity (Low/Med/High)
  - Scalability ceiling
  - Security posture
  - Time-to-deploy
- Visual indicators (badges) for differences.

### FR-5: Recommendation
- AI picks the best option for the user's constraints.
- 2–3 paragraph rationale citing the specific constraints that drove the choice.
- "Why not the others?" section justifying the rejection of alternatives.

### FR-6: Diagram Generation
- LLM emits Mermaid `flowchart` or `graph TB` syntax (valid, renderable, no manual fix needed in 90%+ of cases).
- Live browser render via Mermaid.js.
- User actions: copy source, download `.md` / `.svg` / `.png`.
- Icons/glyphs where Mermaid supports them.

### FR-7: Cost / Security / Scalability Analysis
- **Cost**: Estimated monthly AWS bill broken down by category (compute, storage, networking, data transfer). Notes assumptions (e.g., "assumes 30% avg CPU utilization").
- **Security**: Identified risks (e.g., public S3 bucket, no WAF, missing encryption-at-rest) and concrete AWS mitigations (e.g., "add CloudFront + WAF; enable S3 Block Public Access; enforce TLS via ACM").
- **Scalability**: Bottleneck identification (e.g., "single RDS instance is the ceiling at ~5k writes/sec"), recommended scaling strategy (horizontal vs vertical), AWS-native auto-scaling mechanisms (ASG, Lambda concurrency, DynamoDB on-demand).

### FR-8: AI Architect Chat
- Conversational sidebar; streaming responses.
- User can ask: *"what if I add real-time features?"*, *"make this HIPAA-compliant"*, *"we hit 100k users overnight, what breaks?"*
- Chat maintains context of the current architecture; can suggest modifications.
- Modifications are returned as a structured diff the user can accept/reject.

### FR-9: Iterate / Modify
- Re-running the flow with refined requirements regenerates the options and downstream artifacts.
- Version history per session (in-memory for Phase 1, persisted in Phase 2).

### FR-10: Finalize & Export
- One-click export of finalized architecture as:
  - Markdown report (all sections)
  - Mermaid source file
  - SVG / PNG diagram
  - JSON spec (machine-readable, feeds Phase 3 IaC generation)

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Architecture generation completes in < 30s for typical prompts; chat first-token latency < 2s |
| **Availability** | 99% uptime target for the web app (single-region self-hosted) |
| **Privacy** | No user prompts sent to external APIs; all LLM inference is local via Ollama |
| **Operator cost** | Runs on a single GPU box (e.g., RTX 4090 / 24GB VRAM) for Llama 3.1 70B q4 or Mistral |
| **Browser support** | Latest 2 versions of Chrome, Firefox, Safari, Edge |
| **Accessibility** | WCAG 2.1 AA for input/chat interfaces |
| **Security** | API keys (if any) stored encrypted at rest; rate limiting on chat endpoint (e.g., 30 req/min/user) |
| **Observability** | Structured logs (JSON), request tracing via request ID, basic metrics endpoint |
| **Localization** | English-only in Phase 1; copy strings externalized for future i18n |

---

## 8. Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 App Router, TypeScript, Tailwind) │
│  - Requirements form  - Comparison view  - Mermaid view  │
│  - Chat sidebar       - Export panel                     │
└────────────────────┬─────────────────────────────────────┘
                     │ REST + SSE (streaming chat)
┌────────────────────▼─────────────────────────────────────┐
│  Backend (Python 3.11, FastAPI, Pydantic)               │
│  - /api/architect/generate  - /api/architect/chat       │
│  - /api/architect/refine    - /api/architect/export     │
│  - Constraint extraction pipeline                       │
│  - Prompt templates + JSON-schema tool-calling layer     │
│  - Mermaid validator (AST check)                        │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌────────┐  ┌──────────┐  ┌──────────┐
   │ Ollama │  │PostgreSQL│  │  Redis   │
   │ (Llama │  │(architectures,│ (sessions,│
   │  3.1 / │  │ chat hist,│  │  rate    │
   │Mistral)│  │ users)    │  │  limits) │
   └────────┘  └──────────┘  └──────────┘
```

### Key Components

- **Prompt Orchestration Layer** — Structured prompts that demand JSON-schema outputs for constraint extraction and architecture generation. Uses outlines / instructor for guaranteed schema.
- **Mermaid Validator** — Server-side parser passes generated Mermaid through a syntax check; on failure, retries the LLM with the parser error included as feedback (self-healing).
- **Session Store** — Each "project" is a session with version history; user can roll back to a previous architecture. In-memory (Phase 1), Postgres-backed (Phase 2+).
- **Local LLM Runtime** — Ollama serving `llama3.1:70b-instruct-q4_K_M` by default; `mistral-large` optional for cost-savings on simpler prompts. Both swappable via config.
- **Auth (Phase 2+)** — Email/password + magic link; optional OAuth (Google/GitHub).

---

## 9. Phased Roadmap

### **Phase 1 — MVP** *(Weeks 1–6)*

**Goal:** Deliver the full end-to-end flow for AWS with a local LLM, runnable on a single developer's machine.

**Scope:**
- Requirements input form with examples (FR-1)
- Constraint extraction (FR-2)
- 3 architecture options — AWS only (FR-3)
- Comparison view (FR-4)
- AI recommendation with rationale (FR-5)
- Mermaid diagram generation + live render (FR-6)
- Cost / security / scalability analysis (FR-7)
- AI Architect Chat — single session, no persistence (FR-8)
- Export to Markdown + Mermaid source (subset of FR-10)
- Local dev setup via Docker Compose (Next.js + FastAPI + Postgres + Ollama)
- README with quickstart, prompt-engineering notes, eval suite

**Out of scope:** User accounts, history persistence beyond browser localStorage, multi-cloud, IaC export, team features.

**Success criteria:**
- A first-time user can go from a blank form to a finalized architecture in < 5 minutes.
- Generated Mermaid renders without manual fix in > 90% of cases on the eval suite.
- App runs end-to-end on a single RTX 4090 box.

---

### **Phase 2 — Quality + Multi-Cloud** *(Weeks 7–12)*

**Goal:** Improve architecture quality, add Azure, persist work across sessions.

**Scope:**
- Azure support (parallel to AWS constraint extraction and architecture templates)
- Persistent user accounts (email/password + OAuth)
- Saved projects & version history with rollback
- RAG layer over internal knowledge base (AWS Well-Architected docs, Azure Architecture Center, curated pricing tables)
- Streaming responses (SSE) for chat and generation
- Better Mermaid outputs: layered diagrams with visual legends (AWS/Azure icons via Mermaid themes)
- Refinement loop shown as a visual "diff" between old and new architecture
- Cost estimates now cite region-specific service pricing from the KB

**Success criteria:**
- Architecture quality measured by the internal eval suite improves by 30%.
- Users can switch the target cloud between AWS and Azure for the same requirements.
- p95 chat first-token latency < 2s; p95 full generation < 25s.

---

### **Phase 3 — Enterprise & Export** *(Weeks 13–20)*

**Goal:** Productionize for teams and enable downstream action.

**Scope:**
- Terraform / CloudFormation / Bicep code generation from finalized architecture (FR-10 expanded)
- PDF export with branding (logo, company name, color)
- Team workspaces (share architecture, leave comments, request review)
- GCP support (third cloud provider)
- Compliance presets (HIPAA, PCI-DSS, GDPR) that inject required services automatically
- Optional fine-tuned model on synthetic architecture-QA pairs
- Cost analysis with explicit region selector (us-east-1 vs eu-west-1, etc.) — still LLM-estimated
- Public REST API + webhooks for embedding the architect in other tools

**Success criteria:**
- Generated Terraform passes `terraform plan` on > 80% of canonical scenarios in the eval suite.
- 3 paying pilot teams using the product weekly.
- NPS ≥ 45.

---

### **Phase 4 — Beyond** *(Post-launch, optional)*

- Real-time pricing API integration to replace LLM-estimated costs with live numbers.
- Drag-and-drop diagram editor with Mermaid round-trip.
- Plugin system for custom architecture templates (e.g., "onboarding-flow", "AI/ML training pipeline", "real-time gaming backend").
- Slack and Microsoft Teams bot versions.
- SOC 2 Type II certification (if pursuing enterprise SaaS).

---

## 10. Success Metrics

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|---|---|---|---|
| **Users completing full flow** | 50% | 65% | 75% |
| **Time to finalized architecture** | < 5 min | < 4 min | < 3 min |
| **Mermaid first-pass validity** | 90% | 95% | 98% |
| **Architecture quality (internal eval)** | Baseline | +30% | +50% |
| **Monthly active users** | 200 | 2,000 | 10,000 |
| **NPS** | 30 | 45 | 55 |

### Internal Evaluation Harness
A test set of **50 canonical requirements** (e.g., *"video streaming app for 10k users in EU with GDPR"*, *"B2B SaaS for 500 SMBs with multi-tenant PostgreSQL"*, *"real-time multiplayer game backend for 50k concurrent users"*). Each generated architecture is scored on a 1–5 scale across:

- Service correctness (right services for the use case)
- Security gaps (no obvious holes)
- Cost realism (numbers roughly in range of AWS calculator)
- Diagram accuracy (matches the architecture text)

This harness runs nightly against the configured model and is published as a dashboard.

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Open-source LLM produces invalid Mermaid | High | Server-side Mermaid validator + auto-retry with parser error context (self-healing loop) |
| Local LLM too slow for good UX | Medium | Smaller model (Mistral 7B / Llama 3.1 8B) for simple tasks, larger 70B for complex; optional OpenAI/Anthropic fallback config |
| Hallucinated AWS services or pricing | High | Constrained outputs via JSON schema in Phase 1; RAG over authoritative docs in Phase 2 |
| Self-hosting complexity blocks users | Medium | One-command Docker Compose quickstart in Phase 1; hosted SaaS option in Phase 3 |
| Scope creep (multi-cloud too early) | Medium | Strict Phase 1 AWS-only; Phase 2 unlock gate requires Phase 1 success metrics to be met |
| Cost-to-serve balloons if users run large prompts repeatedly | Low | Per-session token budget; rate limiting; cost surfaced in admin dashboard |
| Ollama / model version drift breaks prompts | Medium | Pin model versions in Docker Compose; snapshot eval suite; regression tests run on model upgrades |

---

## 12. Open Questions

1. **Hosting model** — Is this primarily a self-hosted open-source tool, or will you also run a hosted SaaS? (Affects auth, billing, and infra decisions in Phase 2/3.)
2. **Data retention** — Are user prompts stored in Postgres by default, or should sessions be ephemeral with localStorage only?
3. **Branding / domain** — Is "AI Cloud Architect" the final name, or is there a chosen product name + logo + color palette to apply?
4. **Pricing model (Phase 3)** — Freemium with limits, paid tiers, or fully free/open-source forever?
5. **Domain knowledge depth** — Should Phase 1 also recognize niche patterns (ML training pipelines, IoT fleets, real-time gaming, video streaming) or strictly web/SaaS?
6. **Chat scope** — Should the AI Architect Chat modify the architecture directly ("swap RDS for DynamoDB"), or only suggest changes that the user explicitly accepts?
7. **Model fallback** — Is an optional OpenAI/Anthropic API fallback (when the local LLM fails or stalls) acceptable as an escape hatch, or strict local-only?
8. **Mobile** — Web-only, or native iOS/Android in a future phase?

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Architecture option** | A complete AWS design representing one viable approach (e.g., serverless vs container). |
| **Constraint** | A structured fact extracted from user input (traffic, data, compliance, budget). |
| **Self-healing** | Pattern where LLM output failing validation is re-prompted with the error included. |
| **Eval suite** | Set of canonical requirements + scoring rubric used to measure architecture quality. |
| **RAG** | Retrieval-Augmented Generation — fetching relevant docs to ground the LLM. |
| **IaC** | Infrastructure-as-Code (Terraform / CloudFormation / Bicep). |

---

## 14. Next Steps

Once this PRD is approved (with revisions as needed), the following actions follow:

1. Write the PRD to `prd.md` in the project root. ✅ (this file)
2. Break down Phase 1 into a sprint-by-sprint task list and milestone definitions.
3. Scaffold the Next.js + FastAPI project structure with Docker Compose.
4. Build the prompt templates + JSON schemas for constraint extraction and architecture generation.
5. Stand up the eval harness with 10 seed scenarios before building features (test-driven).
6. Begin Phase 1 implementation.
