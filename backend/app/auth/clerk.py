import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Clerk "Frontend API URL"
CLERK_ISSUER = os.getenv("CLERK_ISSUER")
if not CLERK_ISSUER:
    raise RuntimeError("CLERK_ISSUER is not set. Add it to backend/.env (Clerk dashboard → API keys → Frontend API URL).")

# Origins allowed to use a session token (must match the frontend origin)
AUTHORIZED_PARTIES = ["http://localhost:3000"]

# Fetches and caches Clerk's public signing keys
jwks_client = jwt.PyJWKClient(f"{CLERK_ISSUER.rstrip('/')}/.well-known/jwks.json")
bearer = HTTPBearer(auto_error=False)


def get_current_user_id(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    """Verifies the Clerk session token and returns the Clerk user ID (e.g. "user_2abc...")."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    token = credentials.credentials
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER.rstrip("/"),
            options={"require": ["exp", "iat", "sub"]},
        )
    except jwt.PyJWTError:
        raise unauthorized

    azp = claims.get("azp")
    if azp and azp not in AUTHORIZED_PARTIES:
        raise unauthorized

    return claims["sub"]
