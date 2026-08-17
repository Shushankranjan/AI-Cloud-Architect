from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from pathlib import Path

_NODE_TIMEOUT_SECONDS = 30


def _find_validator_script() -> Path | None:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "frontend" / "scripts" / "validate-mermaid.mjs"
        if candidate.is_file():
            return candidate
    return None


def _heuristic_check(source: str) -> tuple[bool, str | None]:
    stripped = source.strip()
    if not re.match(r"^(flowchart|graph)\s", stripped):
        return False, "Mermaid source must start with 'flowchart' or 'graph'"
    if "-->" not in stripped and "---" not in stripped:
        return False, "Mermaid source contains no edges ('-->' or '---')"
    subgraphs = len(re.findall(r"^\s*subgraph\b", stripped, flags=re.MULTILINE))
    ends = len(re.findall(r"^\s*end\s*$", stripped, flags=re.MULTILINE))
    if subgraphs != ends:
        return False, f"Unbalanced subgraph/end blocks: {subgraphs} 'subgraph' vs {ends} 'end'"
    return True, None


def validate_mermaid(source: str) -> tuple[bool, str | None]:
    """Validate Mermaid source. Returns (ok, error_message).

    Uses the real mermaid parser via the Node script when available;
    otherwise falls back to a lightweight heuristic check.
    """
    ok, error = _heuristic_check(source)
    if not ok:
        return False, error

    node = shutil.which("node")
    script = _find_validator_script()
    if node is None or script is None:
        return True, None

    with tempfile.NamedTemporaryFile("w", suffix=".mmd", delete=False, encoding="utf-8") as tmp:
        tmp.write(source)
        tmp_path = tmp.name
    try:
        result = subprocess.run(
            [node, str(script), "--src", tmp_path],
            capture_output=True,
            text=True,
            timeout=_NODE_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        return False, "Mermaid validation timed out"
    except OSError as exc:
        return False, f"Mermaid validator failed to run: {exc}"
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    if result.returncode == 0:
        return True, None
    message = (result.stderr or result.stdout or "unknown mermaid parse error").strip()
    if message.startswith("ERROR:"):
        message = message[len("ERROR:"):].strip()
    return False, message
