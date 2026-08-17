from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import mermaid_validator
from app.mermaid_validator import validate_mermaid


def _fixture_dir() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "contract" / "fixtures"
        if candidate.is_dir():
            return candidate
    raise RuntimeError("contract/fixtures directory not found")


def _collect_mermaid(value, out: list[str]) -> None:
    if isinstance(value, str) and value.strip().startswith("flowchart"):
        out.append(value)
    elif isinstance(value, list):
        for item in value:
            _collect_mermaid(item, out)
    elif isinstance(value, dict):
        for item in value.values():
            _collect_mermaid(item, out)


def _all_fixture_diagrams() -> list[str]:
    diagrams: list[str] = []
    for file in sorted(_fixture_dir().glob("*.json")):
        _collect_mermaid(json.loads(file.read_text(encoding="utf-8")), diagrams)
    return diagrams


def test_fixture_diagrams_are_valid():
    diagrams = _all_fixture_diagrams()
    assert diagrams, "expected fixture diagrams to exist"
    for source in diagrams:
        ok, error = validate_mermaid(source)
        assert ok, f"fixture diagram should be valid mermaid: {error}"


def test_garbage_is_rejected():
    ok, error = validate_mermaid("this is not mermaid at all")
    assert not ok
    assert error


def test_unbalanced_subgraph_is_rejected():
    source = "flowchart TB\n    subgraph vpc\n        A --> B"
    ok, error = validate_mermaid(source)
    assert not ok
    assert "subgraph" in (error or "")


def test_missing_edges_rejected():
    ok, error = validate_mermaid("flowchart TB\n    A[lonely node]")
    assert not ok
    assert error


def test_heuristic_fallback_accepts_valid_source(monkeypatch):
    monkeypatch.setattr(mermaid_validator.shutil, "which", lambda _name: None)
    source = "flowchart TB\n    A[Client] --> B[API]"
    ok, error = validate_mermaid(source)
    assert ok, error


def test_simple_valid_diagram():
    ok, error = validate_mermaid("flowchart TB\n    A[Client] --> B[API]\n    B --> C[(DB)]")
    assert ok, error


@pytest.mark.parametrize("source", ["", "   ", "pie title X"])
def test_non_flowchart_rejected(source):
    ok, _ = validate_mermaid(source)
    assert not ok
