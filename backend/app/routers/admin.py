from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps.auth import require_admin
from app.models.user import User, RoleEnum
from app.models.course import CourseStatus
from app.schemas.auth import UserOut
from app.schemas.admin import (
    AdminUserCreate, AdminUserUpdate, UserStatusUpdate,
    CategoryCreate, CategoryUpdate, CategoryOut,
    CourseCreate, CourseUpdate, CourseStatusUpdate,
    CourseDetailOut, AssignInstructorsRequest,
    AdminStatsOut, PaginatedResponse
)
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


# ══════════════════════════════════════════════════════════════════════════════
# USERS MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/users", response_model=PaginatedResponse)
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    role: RoleEnum | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    """List users with pagination, role filter, status filter, and name/email search."""
    return admin_service.list_users(db, page, page_size, role, is_active, search)


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
):
    """Create a student or instructor account."""
    return admin_service.create_user(data, db)


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
):
    """Update user details."""
    return admin_service.update_user(user_id, data, db)


@router.patch("/users/{user_id}/status", response_model=UserOut)
def set_user_status(
    user_id: int,
    data: UserStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a user account. Admins cannot change their own status."""
    return admin_service.set_user_status(user_id, data.is_active, current_admin, db)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a user account.
    - Cannot delete own admin account.
    - Blocks with 409 if student has enrollments or progress history.
    - Instructors have course assignments removed first in a transaction.
    """
    return admin_service.delete_user(user_id, current_admin, db)


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORIES MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/categories", response_model=list[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    """List all course categories."""
    return admin_service.list_categories(db)


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new course category."""
    return admin_service.create_category(data, db)


@router.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    """Update a category name."""
    return admin_service.update_category(category_id, data, db)


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category (blocked with 409 if courses use it)."""
    return admin_service.delete_category(category_id, db)


# ══════════════════════════════════════════════════════════════════════════════
# COURSES MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/courses", response_model=PaginatedResponse)
def get_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    category_id: int | None = None,
    status: CourseStatus | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    """List courses with pagination, search, and category/status/active filters."""
    return admin_service.list_admin_courses(db, page, page_size, search, category_id, status, is_active)


@router.post("/courses", response_model=CourseDetailOut, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new course."""
    course = admin_service.create_course(data, current_admin.id, db)
    return admin_service.get_course_detail(course.id, db)


@router.get("/courses/{course_id}", response_model=CourseDetailOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get full course details, including assigned instructors and enrolled students with progress."""
    return admin_service.get_course_detail(course_id, db)


@router.put("/courses/{course_id}", response_model=CourseDetailOut)
def update_course(
    course_id: int,
    data: CourseUpdate,
    db: Session = Depends(get_db),
):
    """Update course title, description, category, or draft/published status."""
    admin_service.update_course(course_id, data, db)
    return admin_service.get_course_detail(course_id, db)


@router.patch("/courses/{course_id}/status", response_model=CourseDetailOut)
def set_course_status(
    course_id: int,
    data: CourseStatusUpdate,
    db: Session = Depends(get_db),
):
    """Activate/deactivate course. Existing enrollments and progress records are preserved."""
    admin_service.set_course_status(course_id, data.is_active, db)
    return admin_service.get_course_detail(course_id, db)


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """Delete a course. Blocked with 409 if students are enrolled."""
    return admin_service.delete_course(course_id, db)


@router.put("/courses/{course_id}/instructors")
def assign_instructors(
    course_id: int,
    data: AssignInstructorsRequest,
    db: Session = Depends(get_db),
):
    """Assign instructors to course in a single transaction. Validates all IDs are active instructors."""
    return admin_service.assign_instructors(course_id, data.instructor_ids, db)


# ══════════════════════════════════════════════════════════════════════════════
# STATS & MONITORING
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/stats", response_model=AdminStatsOut)
def get_stats(db: Session = Depends(get_db)):
    """Get overall platform statistics and course-level enrollment/completion metrics."""
    return admin_service.get_admin_stats(db)
