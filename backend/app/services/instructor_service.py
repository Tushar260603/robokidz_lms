from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status, UploadFile
from fastapi.responses import FileResponse

from app.models.user import User, RoleEnum
from app.models.course import Course, CourseStatus
from app.models.course_instructor import CourseInstructor
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson, LessonStatus
from app.models.material import Material
from app.models.lesson_progress import LessonProgress
from app.core.storage import storage
from app.deps.auth import require_course_instructor
from app.schemas.instructor import (
    LessonCreate, LessonUpdate, LessonOut, MaterialOut,
    CoursePublishUpdate, StudentProgressOut, LessonProgressDetail
)
from app.schemas.admin import CourseListItemOut, EnrolledStudentOut


# ══════════════════════════════════════════════════════════════════════════════
# INSTRUCTOR COURSES & STUDENTS
# ══════════════════════════════════════════════════════════════════════════════

def list_assigned_courses(instructor_id: int, db: Session) -> list[CourseListItemOut]:
    """Returns only courses assigned to the instructor."""
    query = (
        db.query(
            Course,
            func.count(Enrollment.id).label("enrollments_count")
        )
        .join(CourseInstructor, Course.id == CourseInstructor.course_id)
        .outerjoin(Enrollment, Course.id == Enrollment.course_id)
        .filter(CourseInstructor.instructor_id == instructor_id)
        .group_by(Course.id)
        .order_by(Course.id.desc())
    )

    rows = query.all()
    results = []
    for c, enr_count in rows:
        results.append(
            CourseListItemOut(
                id=c.id,
                title=c.title,
                description=c.description,
                category_id=c.category_id,
                category_name=c.category.name if c.category else None,
                status=c.status,
                is_active=c.is_active,
                created_by=c.created_by,
                created_at=c.created_at,
                enrollments_count=enr_count or 0,
            )
        )
    return results


def get_assigned_course_detail(course_id: int, db: Session, current_user: User):
    require_course_instructor(course_id, db, current_user)
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    cat_name = course.category.name if course.category else None
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "category_id": course.category_id,
        "category_name": cat_name,
        "status": course.status,
        "is_active": course.is_active,
        "created_by": course.created_by,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "instructors": [],
        "enrolled_students": []
    }


def get_course_students(course_id: int, db: Session, current_user: User) -> list[EnrolledStudentOut]:
    require_course_instructor(course_id, db, current_user)

    published_lessons = db.query(Lesson.id).filter(
        Lesson.course_id == course_id,
        Lesson.status == LessonStatus.published,
        Lesson.is_deleted == False
    ).all()
    lesson_ids = [lid[0] for lid in published_lessons]
    total_pub = len(lesson_ids)

    enrollments = db.query(Enrollment, User).join(
        User, Enrollment.student_id == User.id
    ).filter(Enrollment.course_id == course_id).all()

    students = []
    for enr, student in enrollments:
        if total_pub == 0:
            pct = 0.0
        else:
            comp_count = db.query(LessonProgress).filter(
                LessonProgress.student_id == student.id,
                LessonProgress.lesson_id.in_(lesson_ids)
            ).count()
            pct = round((comp_count / total_pub) * 100, 1)

        students.append(EnrolledStudentOut(
            id=student.id,
            name=student.name,
            email=student.email,
            enrolled_at=enr.enrolled_at,
            progress_percentage=pct
        ))
    return students


def get_student_progress_detail(
    course_id: int,
    student_id: int,
    db: Session,
    current_user: User
) -> StudentProgressOut:
    require_course_instructor(course_id, db, current_user)

    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    student = db.get(User, student_id)
    if not student or student.role != RoleEnum.student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # Verify student is enrolled in this course
    enrolled = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == student_id
    ).first()
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled in this course")

    # Get all published lessons
    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id,
        Lesson.status == LessonStatus.published,
        Lesson.is_deleted == False
    ).order_by(Lesson.position.asc()).all()

    progress_map = {
        p.lesson_id: p.completed_at
        for p in db.query(LessonProgress).filter(LessonProgress.student_id == student_id).all()
    }

    lesson_details = []
    completed_count = 0
    for l in lessons:
        is_done = l.id in progress_map
        if is_done:
            completed_count += 1
        lesson_details.append(LessonProgressDetail(
            lesson_id=l.id,
            title=l.title,
            position=l.position,
            is_completed=is_done,
            completed_at=progress_map.get(l.id)
        ))

    total = len(lessons)
    pct = round((completed_count / total) * 100, 1) if total > 0 else 0.0

    return StudentProgressOut(
        student_id=student.id,
        student_name=student.name,
        student_email=student.email,
        course_id=course.id,
        course_title=course.title,
        total_published_lessons=total,
        completed_lessons_count=completed_count,
        progress_percentage=pct,
        lessons=lesson_details
    )


# ══════════════════════════════════════════════════════════════════════════════
# LESSONS CRUD & REORDER
# ══════════════════════════════════════════════════════════════════════════════

def list_course_lessons(course_id: int, db: Session, current_user: User) -> list[LessonOut]:
    require_course_instructor(course_id, db, current_user)

    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id,
        Lesson.is_deleted == False
    ).order_by(Lesson.position.asc()).all()

    out = []
    for l in lessons:
        mats = [MaterialOut.model_validate(m) for m in l.materials]
        out.append(LessonOut(
            id=l.id,
            course_id=l.course_id,
            title=l.title,
            content=l.content,
            video_url=l.video_url,
            position=l.position,
            status=l.status,
            created_at=l.created_at,
            updated_at=l.updated_at,
            materials=mats
        ))
    return out


def create_lesson(course_id: int, data: LessonCreate, db: Session, current_user: User) -> LessonOut:
    require_course_instructor(course_id, db, current_user)

    # Next position automatically
    max_pos = db.query(func.max(Lesson.position)).filter(
        Lesson.course_id == course_id,
        Lesson.is_deleted == False
    ).scalar() or 0
    next_pos = max_pos + 1

    lesson = Lesson(
        course_id=course_id,
        title=data.title,
        content=data.content,
        video_url=data.video_url,
        position=next_pos,
        status=data.status,
        is_deleted=False
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    return LessonOut(
        id=lesson.id,
        course_id=lesson.course_id,
        title=lesson.title,
        content=lesson.content,
        video_url=lesson.video_url,
        position=lesson.position,
        status=lesson.status,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        materials=[]
    )


def update_lesson(
    course_id: int,
    lesson_id: int,
    data: LessonUpdate,
    db: Session,
    current_user: User
) -> LessonOut:
    require_course_instructor(course_id, db, current_user)

    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.course_id == course_id,
        Lesson.is_deleted == False
    ).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    # In-place update preserving existing rows & progress records
    if data.title is not None:
        lesson.title = data.title.strip()
    if data.content is not None:
        lesson.content = data.content
    if data.video_url is not None:
        lesson.video_url = data.video_url
    if data.status is not None:
        lesson.status = data.status

    db.commit()
    db.refresh(lesson)

    mats = [MaterialOut.model_validate(m) for m in lesson.materials]
    return LessonOut(
        id=lesson.id,
        course_id=lesson.course_id,
        title=lesson.title,
        content=lesson.content,
        video_url=lesson.video_url,
        position=lesson.position,
        status=lesson.status,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        materials=mats
    )


def delete_lesson(course_id: int, lesson_id: int, db: Session, current_user: User) -> dict:
    require_course_instructor(course_id, db, current_user)

    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.course_id == course_id,
        Lesson.is_deleted == False
    ).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    # Soft delete
    lesson.is_deleted = True
    db.commit()
    return {"detail": "Lesson deleted successfully"}


def update_course_publish_status(
    course_id: int,
    data: CoursePublishUpdate,
    db: Session,
    current_user: User
) -> dict:
    require_course_instructor(course_id, db, current_user)

    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    course.status = data.status
    db.commit()
    return {"detail": f"Course status updated to '{data.status.value}'"}


def reorder_lessons(
    course_id: int,
    ordered_lesson_ids: list[int],
    db: Session,
    current_user: User
) -> dict:
    require_course_instructor(course_id, db, current_user)

    # Validate all IDs belong to this course and are not deleted
    existing_lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id,
        Lesson.is_deleted == False
    ).all()
    existing_map = {l.id: l for l in existing_lessons}

    if set(ordered_lesson_ids) != set(existing_map.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The ordered lesson IDs must match all active lessons of this course exactly"
        )

    # Reorder in one transaction
    try:
        for idx, lid in enumerate(ordered_lesson_ids, start=1):
            existing_map[lid].position = idx
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to reorder lessons")

    return {"detail": "Lessons reordered successfully"}


# ══════════════════════════════════════════════════════════════════════════════
# MATERIALS MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

async def upload_material(
    lesson_id: int,
    file: UploadFile,
    db: Session,
    current_user: User
) -> MaterialOut:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_deleted == False).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    require_course_instructor(lesson.course_id, db, current_user)

    # Save to disk first with validation
    stored_name, mime_type, size_bytes = await storage.save(file)

    # Insert metadata into DB; if fails, clean up file
    try:
        mat = Material(
            lesson_id=lesson.id,
            original_name=file.filename or stored_name,
            stored_name=stored_name,
            mime_type=mime_type,
            size_bytes=size_bytes,
            uploaded_by=current_user.id
        )
        db.add(mat)
        db.commit()
        db.refresh(mat)
        return MaterialOut.model_validate(mat)
    except Exception:
        db.rollback()
        storage.delete(stored_name)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save material record")


def delete_material(material_id: int, db: Session, current_user: User) -> dict:
    mat = db.get(Material, material_id)
    if not mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    lesson = db.get(Lesson, mat.lesson_id)
    if lesson:
        require_course_instructor(lesson.course_id, db, current_user)

    stored_name = mat.stored_name
    db.delete(mat)
    db.commit()
    storage.delete(stored_name)
    return {"detail": "Material deleted successfully"}


def download_material(material_id: int, db: Session, current_user: User) -> FileResponse:
    mat = db.get(Material, material_id)
    if not mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    lesson = db.get(Lesson, mat.lesson_id)
    if not lesson or lesson.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated lesson not found")

    # Authorization Check
    if current_user.role == RoleEnum.admin:
        pass  # Admins always allowed
    elif current_user.role == RoleEnum.instructor:
        require_course_instructor(lesson.course_id, db, current_user)
    elif current_user.role == RoleEnum.student:
        # Check enrolled in course
        is_enrolled = db.query(Enrollment).filter(
            Enrollment.course_id == lesson.course_id,
            Enrollment.student_id == current_user.id
        ).first()
        if not is_enrolled:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")

        # Lesson must be published for students
        if lesson.status != LessonStatus.published:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lesson is not published yet")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    file_path = storage.get_path(mat.stored_name)
    return FileResponse(
        path=file_path,
        filename=mat.original_name,
        media_type=mat.mime_type
    )
