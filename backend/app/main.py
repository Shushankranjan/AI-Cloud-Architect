from __future__ import annotations

import logging
import time
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

load_dotenv()

from app import llm
from app.llm_errors import LLMError
from app.logging_config import request_id_var, setup_logging
from app.routers.architect import router as architect_router

setup_logging()
logger = logging.getLogger("architect")

API_VERSION = "0.1.0"

app = FastAPI(
    title="AI Cloud Architect API",
    version=API_VERSION,
    description=f"Phase 1 backend. Mode: {llm.get_mode()} (provider: {llm.get_provider()}).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(architect_router)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    token = request_id_var.set(request_id)
    start = time.perf_counter()
    try:
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        response.headers["x-request-id"] = request_id
        logger.info(
            "request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
    finally:
        request_id_var.reset(token)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "http_error", "message": exc.detail, "details": None}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Request failed validation",
                "details": exc.errors(),
            }
        },
    )


@app.exception_handler(LLMError)
async def llm_error_handler(request: Request, exc: LLMError):
    logger.error("llm error", extra={"path": request.url.path}, exc_info=exc)
    return JSONResponse(
        status_code=502,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}},
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "version": API_VERSION, "mode": llm.get_mode()}
