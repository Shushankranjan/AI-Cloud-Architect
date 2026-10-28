# Software Requirements Specification (SRS)
## AI Cloud Architect

---

## Abstract

**AI Cloud Architect** is an intelligent, generative-AI powered web application engineered to automate and accelerate cloud infrastructure design for developers, DevOps engineers, and startup founders. By transforming natural-language project descriptions into production-ready AWS cloud architectures, the system eliminates decision paralysis and technical knowledge gaps. It produces three distinct, trade-off-ranked architecture options, provides an AI recommendation with detailed rationale, renders dynamic, interactive Mermaid diagrams, performs deep cost/security/scalability analyses, and enables real-time architectural refinement through a contextual conversational assistant. Built with a contract-first architecture (FastAPI backend + Next.js frontend), the project supports flexible LLM provider execution (OpenRouter, Google Gemini SDK, or local self-hosted Ollama models).

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document details the complete functional, non-functional, external interface, and architectural requirements for the **AI Cloud Architect** system. It serves as the primary technical specification for developers, cloud architects, product managers, and reviewers to ensure alignment across system capabilities, system boundaries, and design goals.

### 1.2 Scope
The scope of **AI Cloud Architect** (Phase 1 MVP and roadmap) encompasses:
- **Natural Language Parsing & Constraint Extraction**: Automated extraction of traffic profiles, data models, compliance needs, budget tiers, and latency sensitivity from user requirements.
- **Architectural Paradigm Generation**: Generation of 3 distinct architectural options (e.g., Serverless-first, Containerized/Kubernetes, Traditional EC2/RDS) tailored for AWS.
- **Interactive Visualizations**: Real-time server-validated Mermaid graph diagrams rendered in the browser.
- **Deep Technical Analysis**: Categorized monthly cost estimates (USD), security risk mitigations, and scalability bottleneck identification.
- **Interactive Refinement**: A context-aware chat assistant capable of proposing structured architectural diffs and versioned session updates.
- **Multi-Format Export**: Production-ready export capabilities for Markdown reports, raw Mermaid syntax, and machine-readable JSON specifications.

### 1.3 Intended Audience
- **Software Engineers & DevOps Engineers**: To review system features, API contracts (`openapi.yaml`), and integration specifications.
- **Startup Founders & Solutions Architects**: To evaluate architectural outputs, trade-offs, security postures, and cost models.
- **Open-Source Contributors & Maintainers**: To understand system boundaries, LLM self-healing logic, and backend/frontend extension points.

### 1.4 Definitions and Abbreviations

| Term | Definition |
| :--- | :--- |
| **SRS** | Software Requirements Specification |
| **PRD** | Product Requirements Document |
| **LLM** | Large Language Model (e.g., Gemini 2.5 Flash, Llama 3.3 70B, Mistral) |
| **Contract-First** | Development methodology where API specs (`openapi.yaml`) precede frontend and backend implementations |
| **Mermaid.js** | JavaScript-based diagramming and charting tool that uses Markdown-inspired text definitions |
| **Self-Healing** | Architectural resilience pattern where validation errors (e.g., syntax errors) are piped back into LLM prompts for automatic correction |
| **IaC** | Infrastructure as Code (Terraform, AWS CloudFormation, OpenTofu) |
| **GDPR / HIPAA / PCI-DSS** | Data privacy and security compliance standards |
| **Ollama** | Local runtime environment for running open-source LLMs locally on consumer GPU hardware |

---

## 2. Overall Description

### 2.1 Product Perspective
AI Cloud Architect is a standalone, full-stack web application designed using a **Contract-First** paradigm. It acts as an intelligent intermediary between high-level business/technical requirements and low-level cloud service configurations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend Client                           │
│  (Requirements Form, Comparison Matrix, Mermaid Canvas, Chat Sidebar)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / JSON API (OpenAPI 3.1)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       FastAPI Backend Service                          │
│  (Routers, Pydantic Validators, Fixture Engine, Mermaid AST Parser)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pluggable Provider Interface
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  OpenRouter API  │       │  Native Gemini   │       │ Local Ollama GPU │
│ (Hosted Models)  │       │     Py SDK       │       │   (Self-Hosted)  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### 2.2 User Classes and Characteristics

1. **Solo Founders / Bootstrapped Builders**:
   - *Technical Level*: Moderate (understands web apps, limited cloud engineering depth).
   - *Needs*: Fast, opinionated AWS recommendations; low-cost architectures; clear "what breaks at scale" insights.
2. **Full-Stack & Backend Developers**:
   - *Technical Level*: High in code, moderate in infrastructure pattern validation.
   - *Needs*: Second opinion on AWS services (ECS vs Lambda, DynamoDB vs RDS); editable Mermaid diagrams; rationale for co-founders.
3. **DevOps & Cloud Engineers**:
   - *Technical Level*: Expert in infrastructure.
   - *Needs*: Rapid scaffolding of architecture visual diagrams and documentation; JSON specs ready for future IaC conversion.

### 2.3 Operating Environment
- **Client Side**: Modern evergreen web browsers (Google Chrome 110+, Mozilla Firefox 110+, Apple Safari 16+, Microsoft Edge 110+).
- **Backend Runtime**: Python 3.11+ environment with `FastAPI`, `Uvicorn`, `Pydantic v2`, `httpx`.
- **Frontend Runtime**: Node.js 18+ runtime executing Next.js 16 (App Router), Tailwind CSS, React 19.
- **LLM Execution Environment**:
  - *Cloud Mode*: OpenRouter API / Google Gemini API via HTTPS.
  - *Local Mode*: NVIDIA GPU (minimum 24GB VRAM for 70B quantized models or 8GB for 8B models) running Ollama.
- **Containerization**: Docker & Docker Compose support for single-command stack orchestration.

### 2.4 Design and Implementation Constraints
1. **Schema Integrity**: All backend responses must strictly adhere to the `contract/openapi.yaml` Pydantic models.
2. **Diagram Syntactical Guarantee**: Generated Mermaid flowchart/graph code must pass syntax parsing without crashing the frontend.
3. **Dual Execution Modes**: System must seamlessly toggle between `stub` mode (deterministic fixture serving) and `live` mode (LLM inference) via environment configuration.
4. **Latency Budget**: End-to-end multi-option architecture generation must complete within 30 seconds.

### 2.5 Assumptions and Dependencies
- **AWS Primary Focus**: Phase 1 assumes Amazon Web Services (AWS) as the primary cloud provider.
- **LLM Availability**: Live mode assumes valid API key credentials (`OPENROUTER_API_KEY` or `GEMINI_API_KEY`) or an accessible local Ollama endpoint (`http://localhost:11434`).
- **Standard Internet Connectivity**: Client internet access for cloud LLM APIs and CDN resource loading.

---

## 3. System Features (Functional Requirements)

### 3.1 Requirements Input & Constraint Parsing
#### Description
Users enter plain-English project descriptions alongside optional structured filters. The backend parses this input using an LLM prompt into a canonical `Constraints` schema.

#### Requirements
- **FR-1.1**: The system shall provide a free-text input supporting between 20 and 5,000 characters.
- **FR-1.2**: The system shall provide optional structured dropdown inputs for `app_type`, `expected_users`, `data_sensitivity`, `budget_tier`, `compliance`, and `region_preference`.
- **FR-1.3**: The system shall offer pre-loaded onboarding examples (e.g., "B2B SaaS with GDPR", "E-Commerce Flash Sale", "IoT Analytics Pipeline").
- **FR-1.4**: The LLM parsing pipeline shall extract canonical constraints, identifying traffic profiles, data models, latency requirements, compliance constraints, explicitly extracted facts, and unresolved ambiguities.

### 3.2 Architecture Option Generation & Trade-off Analysis
#### Description
The system generates exactly three distinct AWS architecture options representing different operational paradigms (e.g., Serverless-first, Containerized, Traditional).

#### Requirements
- **FR-2.1**: The system shall generate 3 options per request, each containing:
  - Option ID, display name, and architectural paradigm.
  - List of categorized AWS services (Compute, Storage, Database, CDN, Security, etc.) with explicit roles.
  - Rationale summary and Trade-offs (Pros, Cons, "Best When" scenarios).
  - Estimated monthly cost range (USD), operational complexity score (Low/Med/High), scalability ceiling description, security posture, and time-to-deploy.
- **FR-2.2**: The system shall auto-generate an AI Recommendation citing specific user constraints and providing a "Why Not the Others" rejection matrix.

### 3.3 Option Selection & Interactive Mermaid Visualization
#### Description
Upon selecting one of the 3 architecture options, the system creates/returns a validated Mermaid diagram representation and renders it on an interactive canvas.

#### Requirements
- **FR-3.1**: The backend shall convert the selected option into valid Mermaid `flowchart` syntax (`graph TB` or `graph LR`).
- **FR-3.2**: The backend shall run server-side syntax validation (Node script / AST parser).
- **FR-3.3**: If syntax validation fails, the backend shall initiate a self-healing loop, re-prompting the LLM with the specific syntax error up to `ARCHITECT_LLM_MAX_RETRIES` times.
- **FR-3.4**: The frontend canvas shall render the visual diagram with zoom, pan, copy source, and image download actions.

### 3.4 In-Depth Cost, Security, and Scalability Analysis
#### Description
Provides detailed breakdown tabs evaluating financial, defensive, and performance dimensions of the chosen architecture.

#### Requirements
- **FR-4.1 (Cost Analysis)**: Categorized itemized cost estimates (Compute, Database, Networking, Storage) with low/high bounds and underlying utilization assumptions.
- **FR-4.2 (Security Analysis)**: Detailed security risk items classified by severity (`low`, `medium`, `high`, `critical`), mitigation guidelines, and specific compliance guidance (GDPR, HIPAA, PCI-DSS, SOC2).
- **FR-4.3 (Scalability Analysis)**: Identification of bottleneck components, horizontal/vertical scaling strategies, AWS auto-scaling mechanisms, and theoretical maximum traffic ceilings.

### 3.5 Conversational AI Architect Chat
#### Description
An interactive sidebar assistant allowing users to ask architectural questions, test hypotheticals, or request modifications.

#### Requirements
- **FR-5.1**: The system shall maintain session history context across conversation turns.
- **FR-5.2**: The chat assistant shall be capable of responding with plain-text explanations alongside structured `ProposedChange` objects (actions: `add_service`, `remove_service`, `replace_service`, `modify_config`).
- **FR-5.3**: The backend shall allow proposed changes to dynamically update the live Mermaid diagram.

### 3.6 Iterative Refinement & Version Control
#### Description
Users can modify their initial requirement prompt or accept proposed changes, triggering an architecture version increment.

#### Requirements
- **FR-6.1**: The system shall increment the session version integer (e.g., `v1` → `v2`) upon calling `/api/architect/refine`.
- **FR-6.2**: The backend session store shall retain state history, enabling comparison between versions.

### 3.7 Multi-Format Export
#### Description
Allows instant export of all generated architectural artifacts into standard developer-friendly formats.

#### Requirements
- **FR-7.1**: Export as Markdown (`.md`) containing full summary, rationale, service breakdown, cost tables, security matrices, and embedded Mermaid code.
- **FR-7.2**: Export raw Mermaid source (`.mmd`).
- **FR-7.3**: Export complete machine-readable JSON specification (`.json`) matching the OpenAPI session schema.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Usability
- **Intuitive Workflow**: Stepped navigation (Requirements → Comparison → Diagram/Analysis → Chat & Refine) requiring zero prior AWS expertise.
- **Clear Visual Badges**: Color-coded badges for operational complexity, risk severity, and cost tiers.
- **Responsive Layout**: Seamless UI experience across desktop monitors (1920x1080) and laptop screens (1366x768).

### 4.2 Performance
- **Generation Time**: Full multi-option architecture response generated in ≤ 30 seconds in cloud live mode (`google/gemini-2.5-flash`).
- **API Response Latency**: Sub-100ms response time for static endpoints (`/api/health`, `/api/architect/examples`) and session retrievals.
- **Frontend Render Time**: Client-side Mermaid rendering completed in under 1 second for standard diagrams (<50 nodes).

### 4.3 Reliability
- **Self-Healing LLM Output**: Automatic correction loop for malformed JSON schemas or unparseable Mermaid syntaxes.
- **Fallback Mode**: Graceful degradation to deterministic mock fixtures (`stub` mode) if LLM credentials are missing or API limits are exhausted.
- **Error Handling**: Structured API error payloads (`ApiError` standard schema) returning explicit status codes (404, 422, 502).

### 4.4 Security
- **Credential Protection**: Zero persistence of third-party API keys in client-side storage or public git repositories; keys are read strictly from backend environment variables.
- **Input Sanitization**: Free-text prompt input validated for character length limits to prevent prompt injection and buffer overflow vectors.
- **CORS Configuration**: Restrictive Cross-Origin Resource Sharing enabled on the FastAPI server for allowed origins.

### 4.5 Maintainability
- **Contract-Driven Consistency**: Synchronized TypeScript interfaces (`frontend/src/lib/types.ts`) and Pydantic models (`backend/app/schemas.py`) generated from `contract/openapi.yaml`.
- **Modular Provider Abstraction**: LLM calls routed through a clean client interface (`llm.py`), enabling effortless swapping between OpenRouter, Gemini SDK, or local Ollama instances without route changes.
- **Automated Test Suite**: Pytest suite checking contract compliance, validator execution, and live LLM integration tests.

### 4.6 Scalability
- **Stateless Backend Design**: Backend handles requests using in-memory or Redis-backed session keys, enabling horizontal scaling across multiple container instances behind a load balancer.

---

## 5. External Interface Requirements

### 5.1 User Interfaces
- **Next.js 16 Web UI**: Single-page application architecture using standard components:
  - `ArchitectFlow`: Stepper orchestration container.
  - `RequirementsForm`: Prompt input & filter selectors.
  - `OptionsScreen`: Side-by-side comparison table & recommendation callout.
  - `WorkspaceScreen`: Main split-screen canvas containing `MermaidDiagram`, `AnalysisTabs`, and `ChatPanel`.

### 5.2 Hardware Interfaces
- **Local GPU Accelerator (Optional)**: Support for NVIDIA CUDA GPUs (8GB to 24GB VRAM) when executing Ollama local inference backend.

### 5.3 Software Interfaces

| Interface | Specification / Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.11 / FastAPI | RESTful Web API service |
| **Contract Spec** | OpenAPI 3.1.0 (`contract/openapi.yaml`) | Single source of truth API contract |
| **Frontend Framework**| Next.js 16 (React 19) / Tailwind CSS | Client user interface |
| **LLM Provider API**  | OpenRouter API / Google Gemini SDK | LLM inference backend |
| **Diagram Engine**    | Mermaid.js (Client) + Node parser (Server) | Syntax validation & visual rendering |

### 5.4 Communication Interfaces
- **Protocol**: HTTP/1.1 and HTTP/2 over TLS (HTTPS in production environments).
- **Data Format**: `application/json` for all REST endpoints.
- **Port Mapping**:
  - Backend Server: `http://localhost:8000`
  - Frontend Application: `http://localhost:3000`

---

## 6. Future Scope & Roadmap Highlights

1. **Phase 2 — Multi-Cloud & Persistence**:
   - Expansion of target clouds to include Microsoft Azure and Google Cloud Platform (GCP).
   - PostgreSQL persistent storage for user accounts, saved projects, and version history.
   - Retrieval-Augmented Generation (RAG) over official AWS/Azure architecture documentation and live pricing APIs.
2. **Phase 3 — IaC Infrastructure Code Generation**:
   - Automated compilation of finalized architectures into validated Terraform (`.tf`), AWS CloudFormation (`.json`/`.yaml`), or Pulumi code snippets.
   - Team workspaces, real-time collaboration, and branded PDF exports.
3. **Phase 4 — Enterprise Integrations**:
   - Real-time cloud pricing API integration (replacing LLM-estimated ranges).
   - Two-way drag-and-drop diagram editor with bi-directional Mermaid synchronization.
   - Slack / Microsoft Teams conversational architect bots.

---
