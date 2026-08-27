import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserOut, TokenOut
from app.auth import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.rate_limit import limiter

router = APIRouter(prefix="/users", tags=["users"])

STAFF_SIGNUP_CODE = os.getenv("STAFF_SIGNUP_CODE", "")


@router.post("", response_model=UserOut)
@limiter.limit("5/minute")  # slows down mass fake-account creation
def signup(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    # A citizen never accidentally becomes staff - the code must be both
    # configured on the server AND match exactly. Empty/unset never matches.
    role = "staff" if STAFF_SIGNUP_CODE and payload.staff_code == STAFF_SIGNUP_CODE else "citizen"

    user = User(name=payload.name, email=payload.email, password_hash=hash_password(payload.password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")  # slows down password brute-forcing
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user_id=user.id)
    return TokenOut(access_token=token)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
