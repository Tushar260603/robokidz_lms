from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, RoleEnum
from app.models.course_instructor import CourseInstructor
from app.models.enrollment import Enrollment

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Core identity dependency ──────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT → load User. Raises 401 on invalid/expired token, 403 if inactive."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user: User | None = db.get(User, int(user_id))
    if user is None:
        raise credentials_exc
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Account is deactivated")
    return user


# ── Role-based access control ─────────────────────────────────────────────────

def require_role(*roles: RoleEnum):
    """
    Dependency factory: require_role(RoleEnum.admin, RoleEnum.instructor)
    Returns a FastAPI dependency that raises 403 if the caller's role isn't in `roles`.
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to: {[r.value for r in roles]}",
            )
        return current_user
    return _check


# Convenience pre-built role guards
require_admin      = require_role(RoleEnum.admin)
require_instructor = require_role(RoleEnum.instructor)
require_student    = require_role(RoleEnum.student)
require_admin_or_instructor = require_role(RoleEnum.admin, RoleEnum.instructor)


# ── Ownership helpers ─────────────────────────────────────────────────────────

def require_course_instructor(course_id: int, db: Session, current_user: User) -> None:
    """
    Raise 403 unless the current user is an instructor assigned to `course_id`
    OR is an admin (admins have full access to all courses).
    """
    if current_user.role == RoleEnum.admin:
        return  # admins bypass the check

    assigned = (
        db.query(CourseInstructor)
        .filter(
            CourseInstructor.course_id == course_id,
            CourseInstructor.instructor_id == current_user.id,
        )
        .first()
    )
    if not assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this course",
        )


def require_enrollment(course_id: int, db: Session, current_user: User) -> None:
    """Raise 403 unless the student is enrolled in `course_id`."""
    enrolled = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.student_id == current_user.id,
        )
        .first()
    )
    if not enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course",
        )
