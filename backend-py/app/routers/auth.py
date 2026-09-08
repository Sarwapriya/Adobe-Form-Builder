"""Port of `backend/src/routes/auth.router.ts` — exact paths, request/response
shapes, status codes, and cookie names/attributes so the existing frontend
(`src/api/apiClient.ts`, `src/auth/authStore.ts`) can't tell this backend
apart from the Node one.

Mounted at `/api/v1/auth` (see `app/main.py`), matching `app.use("/api/v1/auth", authRouter)`.

Every handler builds and mutates its own `Response`/`JSONResponse` object
directly (rather than mutating the FastAPI-injected `response: Response`
parameter and returning a plain model) so that cookie operations
(`set_cookie`/`delete_cookie`) are guaranteed to land on whichever response
actually gets sent — including the error branches, which return a distinct
`JSONResponse` from the success path's.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.middleware.rate_limit import AUTH_RATE_LIMIT, limiter
from app.security.csrf import issue_csrf_cookie, require_csrf_token
from app.security.deps import require_auth
from app.services.auth_service import (
    REFRESH_TOKEN_TTL_SECONDS,
    issue_access_token,
    issue_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
    validate_credentials,
)

router = APIRouter()

REFRESH_COOKIE_NAME = "refreshToken"
# Scoped so the browser only ever sends this cookie back to the auth
# endpoints that actually need it, not every request to the API.
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        # Only requires HTTPS in production — local HTTP development would
        # never receive the cookie back if this were unconditionally true.
        secure=settings.is_production,
        samesite="strict",
        path=REFRESH_COOKIE_PATH,
        max_age=REFRESH_TOKEN_TTL_SECONDS,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class LoginUser(BaseModel):
    id: str
    username: str
    role: str
    subsidiaryId: Optional[str]
    firstName: Optional[str]
    lastName: Optional[str]


class LoginResponse(BaseModel):
    accessToken: str
    user: LoginUser


class RefreshResponse(BaseModel):
    accessToken: str


@router.post("/login")
@limiter.limit(AUTH_RATE_LIMIT)
async def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)) -> JSONResponse:
    user = validate_credentials(db, body.username, body.password)
    if user is None:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"error": "invalid credentials"})

    access_token = issue_access_token(user)
    refresh_token = issue_refresh_token(db, user, request.client.host if request.client else None)

    payload = LoginResponse(
        accessToken=access_token,
        user=LoginUser(
            id=user.id,
            username=user.username,
            role=user.role,
            subsidiaryId=user.subsidiaryId,
            firstName=user.firstName,
            lastName=user.lastName,
        ),
    )
    response = JSONResponse(content=payload.model_dump())
    _set_refresh_cookie(response, refresh_token)
    issue_csrf_cookie(response)
    return response


@router.post("/refresh", dependencies=[Depends(require_csrf_token)])
@limiter.limit(AUTH_RATE_LIMIT)
async def refresh(request: Request, db: Session = Depends(get_db)) -> JSONResponse:
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_token:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"error": "no refresh token presented"})

    rotated = rotate_refresh_token(db, raw_token, request.client.host if request.client else None)
    if rotated is None:
        error_response = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED, content={"error": "invalid or expired refresh token"}
        )
        _clear_refresh_cookie(error_response)
        return error_response

    response = JSONResponse(content=RefreshResponse(accessToken=rotated["accessToken"]).model_dump())
    _set_refresh_cookie(response, rotated["refreshToken"])
    issue_csrf_cookie(response)
    return response


@router.post(
    "/logout",
    dependencies=[Depends(require_auth), Depends(require_csrf_token)],
)
async def logout(request: Request, db: Session = Depends(get_db)) -> Response:
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_token:
        revoke_refresh_token(db, raw_token)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_refresh_cookie(response)
    return response
