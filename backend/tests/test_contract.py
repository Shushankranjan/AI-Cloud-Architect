from fastapi.testclient import TestClient

import pytest

from app import fixtures
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _force_stub_mode(monkeypatch):
    monkeypatch.setenv("ARCHITECT_MODE", "stub")


def setup_function():
    fixtures.reset()


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["mode"] == "stub"


def test_examples():
    res = client.get("/api/architect/examples")
    assert res.status_code == 200
    examples = res.json()
    assert len(examples) >= 3
    assert all({"id", "title", "description"} <= set(e) for e in examples)


def test_full_flow():
    res = client.post(
        "/api/architect/generate",
        json={"description": "A B2B SaaS for 5,000 EU users with GDPR and a $500 budget."},
    )
    assert res.status_code == 200
    gen = res.json()
    assert len(gen["options"]) == 3
    assert gen["recommendation"]["selected_option_id"] in [o["id"] for o in gen["options"]]
    session_id = gen["session_id"]

    res = client.get(f"/api/architect/session/{session_id}")
    assert res.status_code == 200
    assert res.json()["id"] == session_id

    res = client.post(
        "/api/architect/select",
        json={"session_id": session_id, "option_id": gen["recommendation"]["selected_option_id"]},
    )
    assert res.status_code == 200
    sel = res.json()
    assert sel["diagram"]["mermaid_source"].startswith("flowchart")
    assert sel["analysis"]["cost"]["monthly_estimate_usd"]["total_low"] > 0

    res = client.post(
        "/api/architect/chat",
        json={"session_id": session_id, "message": "What about real-time notifications?"},
    )
    assert res.status_code == 200
    chat = res.json()
    assert chat["reply"]
    assert isinstance(chat["proposed_changes"], list)

    res = client.post(
        "/api/architect/refine",
        json={
            "session_id": session_id,
            "requirements": {
                "description": "Same SaaS but real-time collaboration is now required in v1."
            },
        },
    )
    assert res.status_code == 200
    refined = res.json()
    assert refined["version"] == 2
    assert len(refined["options"]) == 3

    res = client.post(
        "/api/architect/export",
        json={"session_id": session_id, "format": "markdown"},
    )
    assert res.status_code == 200
    assert res.json()["content_type"] == "text/markdown"


def test_session_not_found():
    res = client.get("/api/architect/session/sess_missing")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "session_not_found"


def test_option_not_found():
    res = client.post(
        "/api/architect/generate",
        json={"description": "A public REST API for currency conversion, 50k requests/day."},
    )
    session_id = res.json()["session_id"]
    res = client.post(
        "/api/architect/select",
        json={"session_id": session_id, "option_id": "opt-does-not-exist"},
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "option_not_found"


def test_validation_error():
    res = client.post("/api/architect/generate", json={"description": "too short"})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "validation_error"


def test_export_mermaid_requires_selection():
    res = client.post(
        "/api/architect/generate",
        json={"description": "A mobile backend for a fitness app with 20k users year one."},
    )
    session_id = res.json()["session_id"]
    res = client.post(
        "/api/architect/export",
        json={"session_id": session_id, "format": "mermaid"},
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "no_diagram"
