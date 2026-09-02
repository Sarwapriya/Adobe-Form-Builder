"""FastAPI application entrypoint — port of `backend/src/app.ts` (+
`backend/src/index.ts`'s startup wiring).

Middleware order mirrors `app.ts`'s intent as closely as ASGI middleware
semantics allow: security headers (helmet equivalent, including the
deliberate `Cross-Origin-Resource-Policy: cross-origin` override) wrap
everything so they're set on every response regardless of what happens
downstream; CORS and rate limiting sit between that and the routers. FastAPI
handles JSON body parsing and cookie parsing per-request internally (no
separate middleware needed for either, unlike Express's `express.json()`/
`cookie-parser`).

Run with: `uvicorn app.main:app --reload --port 4001` (see `backend-py/README.md`).
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.errors import AppError, status_code_for
from app.middleware.rate_limit import limiter
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.form_builder import router as form_builder_router
from app.routers.project_codes import router as project_codes_router
from app.routers.subsidiaries import router as subsidiaries_router
from app.routers.subsidiary_forms import router as subsidiary_forms_router
from app.routers.subsidiary_locales import router as subsidiary_locales_router
from app.routers.ai import router as ai_router

app = FastAPI(title="FormBuilder Backend (Python port)")

app.state.limiter = limiter


# --- Exception handlers -----------------------------------------------------
# FastAPI/Starlette's own default HTTPException/validation-error bodies don't
# match the Node backend's `{ "error": "..." }` (and, for validation,
# `{ "error": "validation failed", "details": ... }`) shape — these handlers
# normalize to that shape so the frontend's error handling can't tell the
# backends apart.


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail: Any = exc.detail
    content = detail if isinstance(detail, dict) else {"error": detail}
    return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Port of `validateBody`'s 400 + `{ error: "validation failed", details }`
    # shape (`backend/src/middleware/validate.ts`) — FastAPI's own default is
    # a 422 with a bare `{"detail": [...]}` body. `jsonable_encoder` (not a
    # raw `exc.errors()`) is required here: a `@field_validator`/
    # `@model_validator` that raises a plain `ValueError` (our Pydantic
    # request models throughout `app/routers/` do this a lot, mirroring the
    # Node side's zod `.refine()`/regex messages) ends up with that raw
    # exception object embedded under `ctx.error` in pydantic's error dicts,
    # which the stdlib `json` module can't serialize on its own.
    return JSONResponse(
        status_code=400,
        content={"error": "validation failed", "details": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    # Port of `errorHandler.ts`'s typed-error-to-status-code mapping. Not yet
    # reachable from any route in this phase (auth only) — wired now so
    # later phases (project codes, subsidiaries, form builder) can raise
    # these without adding another handler.
    return JSONResponse(status_code=status_code_for(exc), content={"error": exc.message})


app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Middleware --------------------------------------------------------------
# Starlette applies middleware in reverse of registration order (the last
# one added ends up outermost) — registered here innermost-first so
# SecurityHeadersMiddleware, added last, wraps everything.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL] if settings.FRONTEND_URL else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# --- Routers -------------------------------------------------------------
# Auth (phase 1), the admin-config surface (phase 3), and the form-builder
# core (phase 4: admin/forms + subsidiary-scoped forms) — see each router
# module's own doc comment for the Node route file it mirrors.
# TODO(phase N): ai (assistant) router (mirroring app.ts's remaining
# `app.use(...)` call).
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(form_builder_router, prefix="/api/v1/admin/forms", tags=["form-builder"])
app.include_router(project_codes_router, prefix="/api/v1/project-codes", tags=["project-codes"])
app.include_router(subsidiaries_router, prefix="/api/v1/subsidiaries", tags=["subsidiaries"])
app.include_router(subsidiary_locales_router, prefix="/api/v1/subsidiary-locales", tags=["subsidiary-locales"])
app.include_router(subsidiary_forms_router, prefix="/api/v1/forms", tags=["subsidiary-forms"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])


@app.get("/health")
async def health() -> dict:
    """Not present in the Node backend — a convenience liveness endpoint for
    this port; harmless to keep since it doesn't collide with any `/api/v1/*`
    route the frontend calls."""
    return {"status": "ok"}
