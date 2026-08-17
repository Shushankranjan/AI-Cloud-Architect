from __future__ import annotations


class LLMError(Exception):
    """Raised when LLM generation fails after retries. Maps to the contract 502 body."""

    def __init__(self, message: str, code: str = "llm_error", details: object | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details
