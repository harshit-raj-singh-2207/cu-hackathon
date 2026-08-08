from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import ValidationError
from app.config import settings
from app.database import get_database
from app.schemas.user import TokenData

# Maps login endpoint path to OAuth2 bearer scheme for Swagger UI
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Validate the incoming Bearer token:
    1. Decode and verify signature + expiry.
    2. Check the token is not blacklisted (logged out).
    3. Fetch the user document from MongoDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type", "access")

        if email is None:
            raise credentials_exception

        # Only accept access tokens on protected routes
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Use an access token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = TokenData(email=email)

    except (jwt.ExpiredSignatureError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValidationError):
        raise credentials_exception

    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not initialized",
        )

    # Check if token has been blacklisted (user logged out)
    blacklisted = await db["token_blacklist"].find_one({"token": token})
    if blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch matching user document from database
    user = await db["users"].find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    # Normalize MongoDB ObjectID to string key
    user["id"] = str(user["_id"])
    return user
