from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps.auth import require_role, get_current_user
from app.models.user import User, RoleEnum
from app.schemas.instructor import (
    LessonCreate, LessonUpdate, LessonOut, LessonReorderRequest,
    CoursePublishUpdate, StudentProgressOut, MaterialOut
)
from app.schemas.admin import CourseListItemOut, EnrolledStudentOut
from app.services import instructor_service

# Routes requiring instructor role
router = APIRouter(prefix="/instructor", tags=["Instructor"], dependencies=[Depends(require_role(RoleEnum.instructor))])

# Download router for materials (accessible by admin, instructor, or student)
materials_router = APIRouter(tags=["Materials"])


# ══════════════════════════════════════════════════════════════════════════════
# COURSES & STUDENTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/courses", response_model=list[CourseListItemOut])
def get_assigned_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View only courses assigned to the logged-in instructor."""
    return instructor_service.list_assigned_courses(current_user.id, db)


@router.patch("/courses/{course_id}/publish")
def update_course_publish_status(
    course_id: int,
    data: CoursePublishUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish or save assigned course as draft."""
    return instructor_service.update_course_publish_status(course_id, data, db, current_user)


@router.get("/courses/{course_id}/students", response_model=list[EnrolledStudentOut])
def get_course_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View enrolled students with completion percentage for assigned course."""
    return instructor_service.get_course_students(course_id, db, current_user)


@router.get("/courses/{course_id}/students/{student_id}/progress", response_model=StudentProgressOut)
def get_student_progress_detail(
    course_id: int,
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Monitor individual student per-lesson progress detail."""
    return instructor_service.get_student_progress_detail(course_id, student_id, db, current_user)


# ══════════════════════════════════════════════════════════════════════════════
# LESSONS MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/courses/{course_id}/lessons", response_model=list[LessonOut])
def get_course_lessons(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all active lessons in order for an assigned course."""
    return instructor_service.list_course_lessons(course_id, db, current_user)


@router.post("/courses/{course_id}/lessons", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
def create_lesson(
    course_id: int,
    data: LessonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new lesson. Automatically gets next position."""
    return instructor_service.create_lesson(course_id, data, db, current_user)


@router.put("/courses/{course_id}/lessons/reorder")
def reorder_lessons(
    course_id: int,
    data: LessonReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder lessons in a single transaction."""
    return instructor_service.reorder_lessons(course_id, data.lesson_ids, db, current_user)


@router.put("/courses/{course_id}/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(
    course_id: int,
    lesson_id: int,
    data: LessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update lesson content in place without affecting student progress."""
    return instructor_service.update_lesson(course_id, lesson_id, data, db, current_user)


@router.delete("/courses/{course_id}/lessons/{lesson_id}")
def delete_lesson(
    course_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete lesson (sets is_deleted = True)."""
    return instructor_service.delete_lesson(course_id, lesson_id, db, current_user)


# ══════════════════════════════════════════════════════════════════════════════
# MATERIALS MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/lessons/{lesson_id}/materials", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
async def upload_material(
    lesson_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload material (PDF, image, doc, ppt, txt) with validation and size check."""
    return await instructor_service.upload_material(lesson_id, file, db, current_user)


@router.delete("/materials/{material_id}")
def delete_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete material from DB and disk."""
    return instructor_service.delete_material(material_id, db, current_user)


@materials_router.get("/materials/{material_id}/download")
def download_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download learning material with original filename.
    Accessible by assigned instructors, admins, and enrolled students (for published lessons).
    """
    return instructor_service.download_material(material_id, db, current_user)
