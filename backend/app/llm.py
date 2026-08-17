from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Literal, Protocol, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.llm_errors import LLMError

logger = logging.getLogger("architect.llm")

T = TypeVar("T", bound=BaseModel)

Message = tuple[Literal["user", "model"], str]


def get_mode() -> str:
    return os.getenv("ARCHITECT_MODE", "stub").lower()


def get_provider() -> str:
    return os.getenv("ARCHITECT_LLM_PROVIDER", "openrouter").lower()


def get_model() -> str:
    return os.getenv("ARCHITECT_LARGE_MODEL", "google/gemini-2.5-pro")


def get_timeout() -> float:
    return float(os.getenv("ARCHITECT_LLM_TIMEOUT", "120"))


def get_max_retries() -> int:
    return int(os.getenv("ARCHITECT_LLM_MAX_RETRIES", "2"))


@dataclass
class LLMResult:
    raw_text: str
    input_tokens: int | None
    output_tokens: int | None


class GeminiClient:
    enforces_schema = True

    def __init__(self, api_key: str, model: str, timeout: float):
        from google import genai
        from google.genai import types as genai_types

        self._types = genai_types
        self.model = model
        self._client = genai.Client(
            api_key=api_key,
            http_options=genai_types.HttpOptions(
                timeout=int(timeout * 1000),
                retry_options=genai_types.HttpRetryOptions(
                    attempts=6,
                    initial_delay=2.0,
                    max_delay=30.0,
                    exp_base=2.0,
                ),
            ),
        )

    def call(self, *, system: str, messages: list[Message], schema: type[T]) -> LLMResult:
        types = self._types
        contents = [
            types.Content(role=role, parts=[types.Part.from_text(text=text)])
            for role, text in messages
        ]
        try:
            response = self._client.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=0.3,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
            try:
                text = response.text
            except Exception:
                text = None
        except LLMError:
            raise
        except Exception as exc:
            code = getattr(exc, "code", None)
            message = getattr(exc, "message", None) or str(exc)
            raise LLMError(
                f"LLM provider call failed: {message}",
                details={"provider": "gemini", "model": self.model, "status": code},
            ) from exc

        if not text:
            raise LLMError(
                "LLM returned an empty response (possibly blocked by safety filters)",
                details={"provider": "gemini", "model": self.model},
            )
        usage = getattr(response, "usage_metadata", None)
        return LLMResult(
            raw_text=text,
            input_tokens=getattr(usage, "prompt_token_count", None) if usage else None,
            output_tokens=getattr(usage, "candidates_token_count", None) if usage else None,
        )


class LLMClient(Protocol):
    model: str
    enforces_schema: bool

    def call(self, *, system: str, messages: list[Message], schema: type[T]) -> LLMResult: ...


class OpenRouterClient:
    """OpenAI-compatible client for https://openrouter.ai (works with any hosted model)."""

    enforces_schema = False
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    MAX_ATTEMPTS = 5
    RETRYABLE_STATUS = (429, 500, 502, 503, 524)

    def __init__(self, api_key: str, model: str, timeout: float):
        self.model = model
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "X-Title": "AI Cloud Architect",
        }
        self._timeout = timeout

    def call(self, *, system: str, messages: list[Message], schema: type[T]) -> LLMResult:
        payload_messages: list[dict] = [{"role": "system", "content": system}]
        payload_messages += [
            {"role": "assistant" if role == "model" else "user", "content": text}
            for role, text in messages
        ]
        body: dict = {
            "model": self.model,
            "messages": payload_messages,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }

        last_error = "unknown error"
        for attempt in range(self.MAX_ATTEMPTS):
            try:
                response = httpx.post(
                    self.BASE_URL, json=body, headers=self._headers, timeout=self._timeout
                )
            except httpx.HTTPError as exc:
                last_error = f"network error: {exc}"
                logger.warning(
                    "openrouter network error",
                    extra={"model": self.model, "attempt": attempt + 1},
                )
                time.sleep(min(2.0 * (2**attempt), 30.0))
                continue

            if response.status_code in self.RETRYABLE_STATUS:
                retry_after = response.headers.get("retry-after", "")
                delay = (
                    float(retry_after)
                    if retry_after.replace(".", "", 1).isdigit()
                    else min(2.0 * (2**attempt), 30.0)
                )
                last_error = f"HTTP {response.status_code}"
                logger.warning(
                    "openrouter retryable status",
                    extra={"model": self.model, "attempt": attempt + 1, "status": response.status_code},
                )
                time.sleep(delay)
                continue

            if response.status_code == 400 and "response_format" in body:
                body.pop("response_format", None)
                last_error = "response_format rejected by model; retrying without JSON mode"
                continue

            if response.status_code != 200:
                try:
                    message = response.json()["error"]["message"]
                except Exception:
                    message = response.text[:300]
                raise LLMError(
                    f"LLM provider call failed: {message}",
                    details={
                        "provider": "openrouter",
                        "model": self.model,
                        "status": response.status_code,
                    },
                )

            data = response.json()
            if isinstance(data.get("error"), dict):
                raise LLMError(
                    f"LLM provider call failed: {data['error'].get('message', 'unknown error')}",
                    details={"provider": "openrouter", "model": self.model},
                )
            try:
                text = data["choices"][0]["message"]["content"]
            except (KeyError, IndexError, TypeError):
                raise LLMError(
                    "LLM returned an unexpected response shape",
                    details={"provider": "openrouter", "model": self.model},
                )
            if not text:
                raise LLMError(
                    "LLM returned an empty response",
                    details={"provider": "openrouter", "model": self.model},
                )
            usage = data.get("usage") or {}
            return LLMResult(
                raw_text=text,
                input_tokens=usage.get("prompt_tokens"),
                output_tokens=usage.get("completion_tokens"),
            )

        raise LLMError(
            f"LLM provider call failed after {self.MAX_ATTEMPTS} attempts: {last_error}",
            details={"provider": "openrouter", "model": self.model},
        )


_client: LLMClient | None = None


def get_client() -> LLMClient:
    global _client
    if _client is not None:
        return _client
    provider = get_provider()
    if provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        if not api_key:
            raise LLMError(
                "OPENROUTER_API_KEY is not set. Copy .env.example to .env and add your key, "
                "or set ARCHITECT_MODE=stub to run without an LLM.",
                details={"provider": provider},
            )
        _client = OpenRouterClient(api_key=api_key, model=get_model(), timeout=get_timeout())
        return _client
    if provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise LLMError(
                "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key, "
                "or set ARCHITECT_MODE=stub to run without an LLM.",
                details={"provider": provider},
            )
        _client = GeminiClient(api_key=api_key, model=get_model(), timeout=get_timeout())
        return _client
    raise LLMError(
        f"Unsupported LLM provider '{provider}' (supported: openrouter, gemini)",
        details={"provider": provider},
    )


def reset_client() -> None:
    global _client
    _client = None


def generate_structured(
    *,
    system: str,
    messages: list[Message],
    schema: type[T],
    max_retries: int | None = None,
) -> T:
    """Call the LLM with schema-enforced JSON output.

    Self-heals on schema validation failure by re-prompting with the parser
    error included, up to max_retries additional attempts (PRD §11).
    """
    retries = get_max_retries() if max_retries is None else max_retries
    client = get_client()
    if client.enforces_schema:
        system_prompt = system
    else:
        system_prompt = (
            f"{system}\n\nYour JSON output must exactly match this JSON Schema:\n"
            f"{json.dumps(schema.model_json_schema(), indent=2)}"
        )
    history: list[Message] = list(messages)
    last_errors: object = None

    for attempt in range(retries + 1):
        result = client.call(system=system_prompt, messages=history, schema=schema)
        logger.info(
            "llm response",
            extra={
                "model": client.model,
                "attempt": attempt + 1,
                "input_tokens": result.input_tokens,
                "output_tokens": result.output_tokens,
            },
        )
        raw = result.raw_text
        try:
            return schema.model_validate_json(raw)
        except ValidationError as exc:
            last_errors = exc.errors()
            logger.warning(
                "llm output failed schema validation",
                extra={"model": client.model, "attempt": attempt + 1},
            )
            if attempt == retries:
                break
            history = history + [
                ("model", raw),
                (
                    "user",
                    "Your previous response failed schema validation with these errors:\n"
                    f"{exc.errors()}\nRe-emit the corrected JSON only.",
                ),
            ]

    raise LLMError(
        "LLM output failed schema validation after retries",
        code="schema_validation_failed",
        details={"errors": last_errors, "model": client.model},
    )
