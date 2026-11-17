import math
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.category import Category
from app.models.course import Course, CourseStatus
from app.models.course_instructor import CourseInstructor
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson, LessonStatus
from app.models.lesson_progress import LessonProgress
from app.models.material import Material
from app.schemas.student import (
    StudentCourseListItem, StudentCourseDetail, LessonPreviewOut,
    StudentEnrolledCourseItem, StudentCoursePlayer,
    StudentLessonOut, StudentMaterialOut
)


# ══════════════════════════════════════════════════════════════════════════════
# COURSE CATALOG
# ══════════════════════════════════════════════════════════════════════════════

def list_published_courses(
    db: Session,
    current_student: User | None = None,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    category_id: int | None = None
) -> dict:
    query = db.query(Course).filter(
        Course.status == CourseStatus.published,
        Course.is_active == True
    )

    if category_id:
        query = query.filter(Course.category_id == category_id)
    if search:
        pat = f"%{search.strip()}%"
        query = query.filter(or_(Course.title.ilike(pat), Course.description.ilike(pat)))

    total = query.count()
    offset = (page - 1) * page_size
    courses = query.order_by(Course.id.desc()).offset(offset).limit(page_size).all()

    enrolled_course_ids = set()
    if current_student:
        enrolled_course_ids = {
            e.course_id for e in db.query(Enrollment.course_id).filter(Enrollment.student_id == current_student.id).all()
        }

    items = []
    for c in courses:
        # Instructor names
        instructors = [
            u.name for u in db.query(User.name).join(
                CourseInstructor, CourseInstructor.instructor_id == User.id
            ).filter(CourseInstructor.course_id == c.id).all()
        ]

        total_lessons = db.query(Lesson).filter(
            Lesson.course_id == c.id,
            Lesson.status == LessonStatus.published,
            Lesson.is_deleted == False
        ).count()

        items.append(StudentCourseListItem(
            id=c.id,
            title=c.title,
            description=c.description,
            category_id=c.category_id,
            category_name=c.category.name if c.category else None,
            status=c.status,
            is_active=c.is_active,
            created_at=c.created_at,
            instructors=instructors,
            total_lessons=total_lessons,
            is_enrolled=(c.id in enrolled_course_ids)
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def get_course_detail(course_id: int, db: Session, current_student: User | None = None) -> StudentCourseDetail:
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.status == CourseStatus.published,
        Course.is_active == True
    ).first()

    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found or not published")

    instructors = [
        u.name for u in db.query(User.name).join(
            CourseInstructor, CourseInstructor.instructor_id == User.id
        ).filter(CourseInstructor.course_id == course.id).all()
    ]

    published_lessons = db.query(Lesson).filter(
        Lesson.course_id == course.id,
        Lesson.status == LessonStatus.published,
        Lesson.is_deleted == False
    ).order_by(Lesson.position.asc()).all()

    lesson_ids = [l.id for l in published_lessons]
    total_lessons = len(lesson_ids)

    # Count materials per lesson
    mat_counts = {}
    if lesson_ids:
        counts = db.query(
            Material.lesson_id, func.count(Material.id)
        ).filter(Material.lesson_id.in_(lesson_ids)).group_by(Material.lesson_id).all()
        mat_counts = {lid: cnt for lid, cnt in counts}

    lesson_previews = [
        LessonPreviewOut(
            id=l.id,
            title=l.title,
            position=l.position,
            has_video=bool(l.video_url),
            materials_count=mat_counts.get(l.id, 0)
        )
        for l in published_lessons
    ]

    is_enrolled = False
    pct = 0.0
    if current_student:
        enr = db.query(Enrollment).filter(
            Enrollment.course_id == course.id,
            Enrollment.student_id == current_student.id
        ).first()
        is_enrolled = (enr is not None)
        if is_enrolled and total_lessons > 0:
            completed_count = db.query(LessonProgress).filter(
                LessonProgress.student_id == current_student.id,
                LessonProgress.lesson_id.in_(lesson_ids)
            ).count()
            pct = round((completed_count / total_lessons) * 100, 1)

    return StudentCourseDetail(
        id=course.id,
        title=course.title,
        description=course.description,
        category_id=course.category_id,
        category_name=course.category.name if course.category else None,
        status=course.status,
        is_active=course.is_active,
        created_at=course.created_at,
        instructors=instructors,
        total_lessons=total_lessons,
        is_enrolled=is_enrolled,
        progress_percentage=pct,
        lessons=lesson_previews
    )


# ══════════════════════════════════════════════════════════════════════════════
# ENROLLMENT & LEARNING PROGRESS
# ══════════════════════════════════════════════════════════════════════════════

def enroll_in_course(course_id: int, current_student: User, db: Session) -> dict:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if course.status != CourseStatus.published or not course.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot enroll in an unpublished or inactive course"
        )

    # Check already enrolled
    existing = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == current_student.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already enrolled in this course"
        )

    enrollment = Enrollment(course_id=course_id, student_id=current_student.id)
    db.add(enrollment)
    db.commit()
    return {"detail": "Successfully enrolled in course"}


def list_student_enrolled_courses(current_student: User, db: Session) -> list[StudentEnrolledCourseItem]:
    enrollments = db.query(Enrollment, Course).join(
        Course, Enrollment.course_id == Course.id
    ).filter(
        Enrollment.student_id == current_student.id
    ).order_by(Enrollment.enrolled_at.desc()).all()

    results = []
    for enr, c in enrollments:
        instructors = [
            u.name for u in db.query(User.name).join(
                CourseInstructor, CourseInstructor.instructor_id == User.id
            ).filter(CourseInstructor.course_id == c.id).all()
        ]

        lessons = db.query(Lesson).filter(
            Lesson.course_id == c.id,
            Lesson.status == LessonStatus.published,
            Lesson.is_deleted == False
        ).order_by(Lesson.position.asc()).all()

        total = len(lessons)
        progress_rows = {
            p.lesson_id for p in db.query(LessonProgress.lesson_id).filter(
                LessonProgress.student_id == current_student.id
            ).all()
        }

        completed_count = sum(1 for l in lessons if l.id in progress_rows)
        pct = round((completed_count / total) * 100, 1) if total > 0 else 0.0

        # Find first incomplete lesson to resume
        last_incomplete_id = None
        for l in lessons:
            if l.id not in progress_rows:
                last_incomplete_id = l.id
                break

        results.append(StudentEnrolledCourseItem(
            id=c.id,
            title=c.title,
            description=c.description,
            category_name=c.category.name if c.category else None,
            instructors=instructors,
            total_lessons=total,
            completed_lessons=completed_count,
            progress_percentage=pct,
            last_incomplete_lesson_id=last_incomplete_id,
            enrolled_at=enr.enrolled_at
        ))

    return results


def get_course_player(course_id: int, current_student: User, db: Session) -> StudentCoursePlayer:
    # Student must be enrolled
    enr = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == current_student.id
    ).first()
    if not enr:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be enrolled to access course lessons")

    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id,
        Lesson.status == LessonStatus.published,
        Lesson.is_deleted == False
    ).order_by(Lesson.position.asc()).all()

    progress_map = {
        p.lesson_id: p.completed_at
        for p in db.query(LessonProgress).filter(LessonProgress.student_id == current_student.id).all()
    }

    out_lessons = []
    completed_count = 0
    next_incomplete_id = None

    for l in lessons:
        is_done = l.id in progress_map
        if is_done:
            completed_count += 1
        elif next_incomplete_id is None:
            next_incomplete_id = l.id

        mats = [
            StudentMaterialOut(
                id=m.id,
                original_name=m.original_name,
                mime_type=m.mime_type,
                size_bytes=m.size_bytes
            )
            for m in l.materials
        ]

        out_lessons.append(StudentLessonOut(
            id=l.id,
            course_id=l.course_id,
            title=l.title,
            content=l.content,
            video_url=l.video_url,
            position=l.position,
            is_completed=is_done,
            completed_at=progress_map.get(l.id),
            materials=mats
        ))

    total = len(lessons)
    pct = round((completed_count / total) * 100, 1) if total > 0 else 0.0

    return StudentCoursePlayer(
        course_id=course.id,
        course_title=course.title,
        total_lessons=total,
        completed_lessons=completed_count,
        progress_percentage=pct,
        next_incomplete_lesson_id=next_incomplete_id,
        lessons=out_lessons
    )


def mark_lesson_complete(lesson_id: int, current_student: User, db: Session) -> dict:
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.status == LessonStatus.published,
        Lesson.is_deleted == False
    ).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    # Verify student is enrolled in this course
    enrolled = db.query(Enrollment).filter(
        Enrollment.course_id == lesson.course_id,
        Enrollment.student_id == current_student.id
    ).first()
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")

    # Check if already completed
    existing = db.query(LessonProgress).filter(
        LessonProgress.student_id == current_student.id,
        LessonProgress.lesson_id == lesson_id
    ).first()

    if not existing:
        progress = LessonProgress(student_id=current_student.id, lesson_id=lesson_id)
        db.add(progress)
        db.commit()

    return {"detail": "Lesson marked as completed"}
