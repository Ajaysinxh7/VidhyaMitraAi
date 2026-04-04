import os
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Optional[Client] = (
    create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
)


def _require_supabase() -> Client:
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase is not configured on this server.")
    return supabase


# Initialize Router
router = APIRouter()

# --- Pydantic Models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    # username: str
    firstName: str
    lastName: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr  # Supabase native auth relies on email
    password: str

# --- Endpoints ---

@router.post("/register")
async def register_user(user: UserCreate):
    try:
        client = _require_supabase()
        # Supabase handles hashing and secure storage automatically
        response = client.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    # "username": user.username,
                    "first_name": user.firstName,
                    "last_name": user.lastName,
                    "phone": str(user.phone) if user.phone else None  # Store phone as string if provided
                }
            }
        })
        return {
            "message": "User registered successfully. Please check email for verification if enabled.",
            "user_id": response.user.id
        }
    except Exception as e:
        # Supabase throws an exception if the email already exists or password is too weak
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login_user(user: UserLogin):
    try:
        client = _require_supabase()
        response = client.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        # Supabase automatically generates a secure JWT access token
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "user_info": {
                "id": response.user.id,
                "email": response.user.email,
                "username": response.user.user_metadata.get("username"),
                "firstName": response.user.user_metadata.get("first_name"),
                "lastName": response.user.user_metadata.get("last_name")
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
async def refresh_user_token(request: RefreshTokenRequest):
    """Generates a new access token when the old one expires."""
    try:
        client = _require_supabase()
        # Ask Supabase to refresh the session using the refresh token
        response = client.auth.refresh_session(request.refresh_token)
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again."
        )
@router.get("/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    The frontend calls this on page load if it finds a token in localStorage.
    It verifies the token and returns the user's details.
    """
    token = credentials.credentials
    try:
        client = _require_supabase()
        # Supabase securely validates the token and fetches the user's current data
        user_response = client.auth.get_user(token)
        user = user_response.user
        
        # If the token is fake or expired, Supabase throws an error and it jumps to the except block.
        # Otherwise, we return the user data just like the login endpoint!
        return {
            "id": user.id,
            "email": user.email,
            "firstName": user.user_metadata.get("first_name"),
            "lastName": user.user_metadata.get("last_name")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again."
        )