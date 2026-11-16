from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, RoleEnum
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut


def register_student(data: RegisterRequest, db: Session) -> TokenResponse:
    """Register a new student. Role is always forced to 'student'."""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=RoleEnum.student,   # always student — never trust client input
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(sub=user.id, role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


def login_user(data: LoginRequest, db: Session) -> TokenResponse:
    """Authenticate any user role. Rejects inactive accounts."""
    user: User | None = db.query(User).filter(User.email == data.email).first()

    # Use the same error for bad email vs bad password to avoid user enumeration
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Account is deactivated")

    token = create_access_token(sub=user.id, role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
