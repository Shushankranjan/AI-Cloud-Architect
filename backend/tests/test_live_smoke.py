"""End-to-end smoke test against the real LLM provider.

Opt-in: requires ARCHITECT_LIVE_TESTS=1 (GEMINI_API_KEY + ARCHITECT_MODE=live
come from the environment or the .env file loaded by the app). Run with:

    ARCHITECT_LIVE_TESTS=1 .venv/bin/python -m pytest backend/tests/test_live_smoke.py -v -s

Note: consumes real API quota (free tier allows ~20 requests/day per model).
"""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app import fixtures
from app.main import app

pytestmark = pytest.mark.skipif(
    os.getenv("ARCHITECT_LIVE_TESTS") != "1",
    reason="opt-in: set ARCHITECT_LIVE_TESTS=1 (requires a Gemini key and live mode)",
)

client = TestClient(app)


def setup_function():
    fixtures.reset()


def test_full_live_flow():
    res = client.get("/api/health")
    assert res.json()["mode"] == "live"

    res = client.post(
        "/api/architect/generate",
        json={
            "description": "A B2B SaaS for 5,000 EU users with GDPR and a $500 monthly budget.",
            "app_type": "web_app",
            "expected_users": "1k_10k",
            "data_sensitivity": "pii",
            "budget_tier": "standard",
            "compliance": ["gdpr"],
            "region_preference": "eu-central-1",
        },
    )
    assert res.status_code == 200, res.text
    gen = res.json()
    assert len(gen["options"]) == 3
    paradigms = {option["paradigm"] for option in gen["options"]}
    assert len(paradigms) >= 2
    assert gen["recommendation"]["selected_option_id"] in {o["id"] for o in gen["options"]}
    assert gen["constraints"]["traffic_profile"]
    assert gen["constraints"]["extracted_facts"]
    session_id = gen["session_id"]

    res = client.post(
        "/api/architect/select",
        json={"session_id": session_id, "option_id": gen["recommendation"]["selected_option_id"]},
    )
    assert res.status_code == 200, res.text
    sel = res.json()
    assert sel["diagram"]["mermaid_source"].startswith("flowchart")
    cost = sel["analysis"]["cost"]["monthly_estimate_usd"]
    assert cost["total_high"] >= cost["total_low"] > 0
    assert sel["analysis"]["security"]["risks"]
    assert sel["analysis"]["scalability"]["bottlenecks"]

    res = client.post(
        "/api/architect/chat",
        json={
            "session_id": session_id,
            "message": "What breaks first if we hit 100k users overnight?",
        },
    )
    assert res.status_code == 200, res.text
    assert res.json()["reply"]

    res = client.post(
        "/api/architect/export",
        json={"session_id": session_id, "format": "mermaid"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["content"].startswith("flowchart")
