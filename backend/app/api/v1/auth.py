from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.config import settings
from app.database import get_database
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenPair,
    TokenData,
    RefreshTokenRequest,
    MessageResponse,
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.api.deps import get_current_user

router = APIRouter()

# ─── Helper ────────────────────────────────────────────────────────────────────

def _user_to_response(user: dict) -> dict:
    """Normalize current and legacy MongoDB users into the public schema."""
    email = str(user.get("email") or "")

    def string_list(value) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item) for item in value if item is not None]

    return {
        "id": str(user.get("_id", user.get("id", ""))),
        "name": str(user.get("name") or email.split("@", 1)[0] or "User"),
        "email": email,
        "is_active": bool(user.get("is_active", True)),
        "created_at": user.get("created_at"),
        "skills": string_list(user.get("skills")),
        "education": user.get("education") if isinstance(user.get("education"), str) else None,
        "portfolio_links": string_list(user.get("portfolio_links")),
        "profile_image_url": user.get("profile_image_url") if isinstance(user.get("profile_image_url"), str) else None,
        "resume_url": user.get("resume_url") if isinstance(user.get("resume_url"), str) else None,
    }


def _password_matches(user: dict | None, plain_password: str) -> bool:
    """Return False for missing/legacy/malformed password hashes instead of raising 500."""
    if not user:
        return False
    hashed_password = user.get("hashed_password")
    if not isinstance(hashed_password, str) or not hashed_password:
        return False
    try:
        return verify_password(plain_password, hashed_password)
    except (TypeError, ValueError):
        return False


# ─── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(user_in: UserCreate):
    """
    Create a new user account:
    - Validates name, email, and password (min 8 chars).
    - Rejects duplicate emails.
    - Hashes the password with bcrypt before storage.
    - Returns the created user profile (no password).
    """
    db = get_database()

    # Reject duplicate email registrations
    try:
        existing = await db["users"].find_one({"email": user_in.email})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is temporarily unavailable. Check the Atlas connection and try again.",
        ) from exc
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": user_in.name.strip(),
        "email": user_in.email,
        "hashed_password": hash_password(user_in.password),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "skills": [],
        "education": None,
        "portfolio_links": [],
        "profile_image_url": None,
        "resume_url": None,
        "resume_filename": None,
    }

    try:
        result = await db["users"].insert_one(user_doc)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please sign in instead.",
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB disconnected while creating the account. Please try again.",
        ) from exc
    user_doc["id"] = str(result.inserted_id)
    return user_doc


# ─── Login (OAuth2 form — used by Swagger UI) ──────────────────────────────────

@router.post(
    "/login",
    response_model=TokenPair,
    summary="Login with email & password (form data)",
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate via OAuth2 form (used by Swagger UI's Authorize button).
    - `username` field maps to the user's email address.
    - Returns both an access token and a refresh token.
    """
    db = get_database()

    user = await db["users"].find_one({"email": form_data.username})
    if not _password_matches(user, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    access_token = create_access_token(user["email"])
    refresh_token = create_refresh_token(user["email"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# ─── Login (JSON body — used by frontend/mobile) ───────────────────────────────

@router.post(
    "/login/json",
    response_model=TokenPair,
    summary="Login with email & password (JSON body)",
)
async def login_json(credentials: UserLogin):
    """
    Authenticate via JSON body (for frontend clients).
    Returns both an access token and a refresh token.
    """
    db = get_database()

    user = await db["users"].find_one({"email": credentials.email})
    if not _password_matches(user, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    access_token = create_access_token(user["email"])
    refresh_token = create_refresh_token(user["email"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# ─── Token Refresh ─────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=Token,
    summary="Obtain a new access token using a refresh token",
)
async def refresh_token(body: RefreshTokenRequest):
    """
    Exchange a valid refresh token for a new access token.
    - Validates the refresh token signature and expiry.
    - Ensures the token type is 'refresh'.
    - Does not invalidate the old refresh token (stateless).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(body.refresh_token)

    token_type = payload.get("type")
    email = payload.get("sub")

    if token_type != "refresh" or not email:
        raise credentials_exception

    db = get_database()

    # Verify user still exists and is active
    user = await db["users"].find_one({"email": email})
    if not user or not user.get("is_active", True):
        raise credentials_exception

    # Check refresh token is not blacklisted
    blacklisted = await db["token_blacklist"].find_one({"token": body.refresh_token})
    if blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked. Please log in again.",
        )

    new_access_token = create_access_token(email)
    return {"access_token": new_access_token, "token_type": "bearer"}


# ─── Logout ────────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout and revoke the current access token",
)
async def logout(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")),
    current_user: dict = Depends(get_current_user),
):
    """
    Logout the current user:
    - Adds the current access token to a MongoDB blacklist collection.
    - Subsequent requests with this token will be rejected.
    - TTL index on `expires_at` automatically cleans up expired tokens.
    """
    db = get_database()

    # Decode token to read expiry for TTL cleanup
    payload = decode_token(token)
    expires_at = None
    if payload and "exp" in payload:
        expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)

    await db["token_blacklist"].insert_one({
        "token": token,
        "user_email": current_user["email"],
        "revoked_at": datetime.now(timezone.utc),
        "expires_at": expires_at,
    })

    return {"message": "Successfully logged out. Token has been revoked."}


# ─── Get Current User (Protected Route) ───────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user's profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Protected route — requires a valid Bearer access token.
    Returns the profile of the currently logged-in user.
    """
    return _user_to_response(current_user)


# ─── Change Password (Protected Route) ────────────────────────────────────────

@router.put(
    "/change-password",
    response_model=MessageResponse,
    summary="Change the current user's password",
)
async def change_password(
    current_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Protected route — allows an authenticated user to change their password.
    - Verifies the current password before applying the change.
    - Hashes the new password with bcrypt.
    - Minimum length of 8 characters enforced.
    """
    if not verify_password(current_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 8 characters long.",
        )

    db = get_database()

    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {
            "hashed_password": hash_password(new_password),
            "updated_at": datetime.now(timezone.utc),
        }},
    )

    return {"message": "Password changed successfully."}
