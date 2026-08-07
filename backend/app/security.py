from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt import InvalidTokenError as JWTError
from passlib.context import CryptContext

from app.config import settings

# ─── Password Hashing ──────────────────────────────────────────────────────────

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of the given plain-text password."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches the stored hash."""
    return _pwd_context.verify(plain_password, hashed_password)


# ─── JWT Helpers ───────────────────────────────────────────────────────────────

def _create_token(subject: str, expires_delta: timedelta, extra: dict[str, Any] | None = None) -> str:
    """
    Internal helper — build and sign a JWT.

    Args:
        subject:       Unique identifier to embed (usually the user's MongoDB _id as string).
        expires_delta: How long until the token expires.
        extra:         Any additional claims to embed (e.g. {"type": "refresh"}).
    """
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: str) -> str:
    """
    Create a short-lived JWT access token.

    Expires after ACCESS_TOKEN_EXPIRE_MINUTES (default 60 min).
    """
    return _create_token(
        subject=user_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra={"type": "access"},
    )


def create_refresh_token(user_id: str) -> str:
    """
    Create a long-lived JWT refresh token.

    Expires after REFRESH_TOKEN_EXPIRE_DAYS (default 7 days).
    """
    return _create_token(
        subject=user_id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        extra={"type": "refresh"},
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT.

    Returns:
        The decoded payload dict.

    Raises:
        JWTError: If the token is invalid, expired, or tampered with.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def get_user_id_from_token(token: str) -> str:
    """
    Convenience wrapper — extract just the user ID (sub claim) from a token.

    Raises:
        JWTError: If the token is invalid or the 'sub' claim is missing.
    """
    payload = decode_token(token)
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise JWTError("Token is missing the 'sub' claim.")
    return user_id


def get_token_type(token: str) -> str:
    """Return the 'type' claim from a token ('access' or 'refresh')."""
    payload = decode_token(token)
    return payload.get("type", "unknown")
