# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers, DevOps engineers, SysAdmins, and Cloud Solution Architects who need to quickly design, validate, and compare AWS cloud infrastructure topologies from plain-English requirements.

## Product Purpose

AI Cloud Architect automates the cloud solution architecture workflow. It translates raw user requirements into 3 distinct AWS architectural options, recommends the optimal approach, provides live interactive Mermaid.js architecture diagrams, and evaluates cost, security, and scalability trade-offs.

## Positioning

A contract-first, schema-enforced cloud architecture generator featuring deterministic stub testing, self-healing LLM schema validation, side-by-side multi-option comparison, and real-time interactive diagram refinement via an AI assistant.

## Operating Context

Web application used during early planning, RFC drafting, technical design reviews, and infrastructure planning. The user experience centers around a multi-step session flow: requirements input → architecture options generation → selection & diagram visualization → AI chat refinement → multi-format export (Markdown, Mermaid, JSON).

## Capabilities and Constraints

- **Contract-First Architecture:** Strict OpenAPI 3.1 contract ensuring consistent frontend-backend communication.
- **Dual Mode Execution:** Operates in `stub` mode (instant fixtures for offline testing) or `live` mode (LLM powered via OpenRouter or native Gemini).
- **Automated Validation:** Server and client-side validation for generated Mermaid.js diagram syntax with LLM self-healing retries.
- **Interactive Refinement:** AI Chat assistant capable of updating architectural session state and regenerating diagrams.
- **Exporting:** Supports exporting architectures to Markdown reports, raw Mermaid diagrams, and structured JSON.
- **Scope Limit:** Phase 1 focuses on AWS infrastructure design patterns.

## Brand Commitments

- Product Name: AI Cloud Architect (or AI-Powered Cloud Solution Architect)
- Professional, technical, authoritative tone tailored for engineering teams.

## Evidence on Hand

- `openapi.yaml`: Complete OpenAPI 3.1 contract in `contract/openapi.yaml`.
- `prd.md`: Product Requirements Document detailing Phase 1 scope and system flows.
- `srs_specification.md`: Software Requirements Specification detailing functional & non-functional requirements.
- `DESIGN.md`: Architectural documentation detailing backend LLM pipeline, contract-first design, and system architecture.

## Product Principles

1. **Precision Over Ambiguity:** Generate concrete, valid AWS service components and structured diagrams rather than vague high-level summaries.
2. **Deterministic Integrity:** Contract-first execution guarantees that UI, backend schemas, and LLM outputs strictly align.
3. **Transparent Trade-offs:** Always present trade-offs across cost, security, performance, and complexity when proposing architectures.
4. **Iterative Collaboration:** Architectural design is conversational; users must be able to refine and tweak diagrams via natural dialogue.

## Accessibility & Inclusion

- Web Content Accessibility Guidelines (WCAG) 2.1 AA compliance target for all interactive form fields, tab navigation, color contrast, and dynamic canvas views.
