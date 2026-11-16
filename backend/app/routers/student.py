from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps.auth import get_current_user, require_role
from app.models.user import User, RoleEnum
from app.schemas.admin import PaginatedResponse
from app.schemas.student import (
    StudentCourseDetail, StudentEnrolledCourseItem,
    StudentCoursePlayer
)
from app.services import student_service

# Public/student browsing router
public_course_router = APIRouter(prefix="/courses", tags=["Course Catalog"])

# Protected student router
student_router = APIRouter(prefix="/student", tags=["Student"], dependencies=[Depends(require_role(RoleEnum.student))])


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC / STUDENT CATALOG
# ══════════════════════════════════════════════════════════════════════════════

@public_course_router.get("", response_model=PaginatedResponse)
def get_published_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: str | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db)
):
    """View and search available published courses with category filtering and pagination."""
    return student_service.list_published_courses(db, None, page, page_size, search, category_id)


@public_course_router.get("/{course_id}", response_model=StudentCourseDetail)
def get_published_course_detail(
    course_id: int,
    db: Session = Depends(get_db)
):
    """View course details and instructors for a published course."""
    return student_service.get_course_detail(course_id, db, None)


# ══════════════════════════════════════════════════════════════════════════════
# STUDENT PROTECTED ACTIONS
# ══════════════════════════════════════════════════════════════════════════════

@student_router.post("/courses/{course_id}/enroll", status_code=status.HTTP_201_CREATED)
def enroll_course(
    course_id: int,
    current_student: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enroll into a published course."""
    return student_service.enroll_in_course(course_id, current_student, db)


@student_router.get("/my-courses", response_model=list[StudentEnrolledCourseItem])
def get_my_enrolled_courses(
    current_student: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View enrolled courses and overall learning progress."""
    return student_service.list_student_enrolled_courses(current_student, db)


@student_router.get("/courses/{course_id}/player", response_model=StudentCoursePlayer)
def get_course_player(
    course_id: int,
    current_student: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Access course player, lessons, materials, and completion status."""
    return student_service.get_course_player(course_id, current_student, db)


@student_router.post("/lessons/{lesson_id}/complete")
def mark_lesson_complete(
    lesson_id: int,
    current_student: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a lesson as completed to update progress percentage."""
    return student_service.mark_lesson_complete(lesson_id, current_student, db)
