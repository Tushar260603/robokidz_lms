import math
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.category import Category
from app.models.course import Course, CourseStatus
from app.models.course_instructor import CourseInstructor
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson, LessonStatus
from app.models.lesson_progress import LessonProgress
from app.core.security import hash_password
from app.schemas.admin import (
    AdminUserCreate, AdminUserUpdate,
    CategoryCreate, CategoryUpdate,
    CourseCreate, CourseUpdate,
    CourseDetailOut, InstructorOut, EnrolledStudentOut,
    CourseListItemOut, AdminStatsOut, CourseStatItem
)
from app.schemas.auth import UserOut


# ══════════════════════════════════════════════════════════════════════════════
# USERS SERVICE
# ══════════════════════════════════════════════════════════════════════════════

def list_users(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    role: RoleEnum | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> dict:
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(pattern), User.email.ilike(pattern)))

    total = query.count()
    offset = (page - 1) * page_size
    users = query.order_by(User.id.desc()).offset(offset).limit(page_size).all()

    return {
        "items": [UserOut.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def create_user(data: AdminUserCreate, db: Session) -> UserOut:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        bio=data.bio,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


def update_user(user_id: int, data: AdminUserUpdate, db: Session) -> UserOut:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.email and data.email != user.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already taken")
        user.email = data.email

    if data.name is not None:
        user.name = data.name.strip()
    if data.bio is not None:
        user.bio = data.bio
    if data.password:
        user.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


def set_user_status(user_id: int, is_active: bool, current_admin: User, db: Session) -> UserOut:
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot activate or deactivate their own account"
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


def delete_user(user_id: int, current_admin: User, db: Session) -> dict:
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot delete their own account"
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # If student, check if has enrollments or progress
    if user.role == RoleEnum.student:
        has_enrollments = db.query(Enrollment).filter(Enrollment.student_id == user_id).first()
        has_progress = db.query(LessonProgress).filter(LessonProgress.student_id == user_id).first()
        if has_enrollments or has_progress:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student has active enrollments or progress history. Deactivate the account instead of deleting."
            )
        db.delete(user)
        db.commit()
        return {"detail": "Student account deleted successfully"}

    # If instructor: remove course assignments first in one transaction
    if user.role == RoleEnum.instructor:
        try:
            db.query(CourseInstructor).filter(CourseInstructor.instructor_id == user_id).delete(synchronize_session=False)
            db.delete(user)
            db.commit()
            return {"detail": "Instructor and course assignments deleted successfully"}
        except Exception:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete instructor")

    # Any other user (e.g. other admin)
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}


# ══════════════════════════════════════════════════════════════════════════════
# CATEGORIES SERVICE
# ══════════════════════════════════════════════════════════════════════════════

def list_categories(db: Session):
    return db.query(Category).order_by(Category.name.asc()).all()


def get_category(category_id: int, db: Session) -> Category:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


def create_category(data: CategoryCreate, db: Session) -> Category:
    if db.query(Category).filter(Category.name == data.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")
    category = Category(name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(category_id: int, data: CategoryUpdate, db: Session) -> Category:
    category = get_category(category_id, db)
    if data.name != category.name:
        if db.query(Category).filter(Category.name == data.name).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")
        category.name = data.name
        db.commit()
        db.refresh(category)
    return category


def delete_category(category_id: int, db: Session) -> dict:
    category = get_category(category_id, db)
    # Check if courses use this category
    course_count = db.query(Course).filter(Course.category_id == category_id).count()
    if course_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category cannot be deleted because it is used by {course_count} course(s). Reassign them first."
        )
    db.delete(category)
    db.commit()
    return {"detail": "Category deleted successfully"}


# ══════════════════════════════════════════════════════════════════════════════
# COURSES SERVICE
# ══════════════════════════════════════════════════════════════════════════════

def list_admin_courses(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    category_id: int | None = None,
    status_filter: CourseStatus | None = None,
    is_active: bool | None = None,
) -> dict:
    query = db.query(
        Course,
        Category.name.label("category_name"),
        func.count(Enrollment.id).label("enrollments_count")
    ).outerjoin(Category, Course.category_id == Category.id)\
     .outerjoin(Enrollment, Course.id == Enrollment.course_id)\
     .group_by(Course.id, Category.name)

    if category_id:
        query = query.filter(Course.category_id == category_id)
    if status_filter:
        query = query.filter(Course.status == status_filter)
    if is_active is not None:
        query = query.filter(Course.is_active == is_active)
    if search:
        pat = f"%{search.strip()}%"
        query = query.filter(or_(Course.title.ilike(pat), Course.description.ilike(pat)))

    total = query.count()
    offset = (page - 1) * page_size
    rows = query.order_by(Course.id.desc()).offset(offset).limit(page_size).all()

    items = []
    for course, cat_name, count in rows:
        item = CourseListItemOut(
            id=course.id,
            title=course.title,
            description=course.description,
            category_id=course.category_id,
            category_name=cat_name,
            status=course.status,
            is_active=course.is_active,
            created_by=course.created_by,
            created_at=course.created_at,
            enrollments_count=count or 0,
        )
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def create_course(data: CourseCreate, creator_id: int, db: Session) -> Course:
    if data.category_id:
        get_category(data.category_id, db)

    course = Course(
        title=data.title,
        description=data.description,
        category_id=data.category_id,
        status=data.status,
        is_active=True,
        created_by=creator_id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def get_course_detail(course_id: int, db: Session) -> CourseDetailOut:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    cat_name = course.category.name if course.category else None

    # Instructors
    assigned = db.query(User).join(
        CourseInstructor, CourseInstructor.instructor_id == User.id
    ).filter(CourseInstructor.course_id == course_id).all()
    instructors = [InstructorOut.model_validate(u) for u in assigned]

    # Published lessons count for progress calculation
    published_lessons = db.query(Lesson.id).filter(
        Lesson.course_id == course_id,
        Lesson.status == LessonStatus.published,
        Lesson.is_deleted == False
    ).all()
    lesson_ids = [lid[0] for lid in published_lessons]
    total_lessons = len(lesson_ids)

    # Enrolled students with individual progress
    enrollments = db.query(Enrollment, User).join(
        User, Enrollment.student_id == User.id
    ).filter(Enrollment.course_id == course_id).all()

    enrolled_students = []
    for enr, student in enrollments:
        if total_lessons == 0:
            pct = 0.0
        else:
            completed_count = db.query(LessonProgress).filter(
                LessonProgress.student_id == student.id,
                LessonProgress.lesson_id.in_(lesson_ids)
            ).count()
            pct = round((completed_count / total_lessons) * 100, 1)

        enrolled_students.append(EnrolledStudentOut(
            id=student.id,
            name=student.name,
            email=student.email,
            enrolled_at=enr.enrolled_at,
            progress_percentage=pct
        ))

    return CourseDetailOut(
        id=course.id,
        title=course.title,
        description=course.description,
        category_id=course.category_id,
        category_name=cat_name,
        status=course.status,
        is_active=course.is_active,
        created_by=course.created_by,
        created_at=course.created_at,
        updated_at=course.updated_at,
        instructors=instructors,
        enrolled_students=enrolled_students
    )


def update_course(course_id: int, data: CourseUpdate, db: Session) -> Course:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if data.category_id is not None:
        get_category(data.category_id, db)
        course.category_id = data.category_id
    if data.title is not None:
        course.title = data.title.strip()
    if data.description is not None:
        course.description = data.description
    if data.status is not None:
        course.status = data.status

    db.commit()
    db.refresh(course)
    return course


def set_course_status(course_id: int, is_active: bool, db: Session) -> Course:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Modifying is_active preserves existing enrollments and progress records
    course.is_active = is_active
    db.commit()
    db.refresh(course)
    return course


def delete_course(course_id: int, db: Session) -> dict:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Check if there are enrollments
    enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()
    if enrollment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Course cannot be deleted because {enrollment_count} student(s) are enrolled. Deactivate the course instead."
        )

    db.delete(course)
    db.commit()
    return {"detail": "Course deleted successfully"}


def assign_instructors(course_id: int, instructor_ids: list[int], db: Session) -> dict:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Validate that every ID has role instructor and is active
    unique_ids = list(set(instructor_ids))
    if unique_ids:
        instructors = db.query(User).filter(
            User.id.in_(unique_ids),
            User.role == RoleEnum.instructor,
            User.is_active == True
        ).all()

        found_ids = {u.id for u in instructors}
        invalid_ids = set(unique_ids) - found_ids
        if invalid_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"IDs {list(invalid_ids)} are either not active instructors or do not exist"
            )

    # Perform assignment in one transaction
    try:
        # Clear existing
        db.query(CourseInstructor).filter(CourseInstructor.course_id == course_id).delete(synchronize_session=False)
        # Add new
        for inst_id in unique_ids:
            db.add(CourseInstructor(course_id=course_id, instructor_id=inst_id))
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assign instructors")

    return {"detail": f"Successfully assigned {len(unique_ids)} instructor(s) to course"}


# ══════════════════════════════════════════════════════════════════════════════
# STATS SERVICE
# ══════════════════════════════════════════════════════════════════════════════

def get_admin_stats(db: Session) -> AdminStatsOut:
    total_users = db.query(User).count()
    users_by_role_raw = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    users_by_role = {role.value: count for role, count in users_by_role_raw}

    for r in [RoleEnum.admin, RoleEnum.instructor, RoleEnum.student]:
        if r.value not in users_by_role:
            users_by_role[r.value] = 0

    total_courses = db.query(Course).count()
    total_enrollments = db.query(Enrollment).count()

    courses = db.query(Course).all()
    course_stats = []

    for c in courses:
        enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()

        published_lessons = db.query(Lesson.id).filter(
            Lesson.course_id == c.id,
            Lesson.status == LessonStatus.published,
            Lesson.is_deleted == False
        ).all()
        published_ids = [lid[0] for lid in published_lessons]
        total_pub = len(published_ids)

        completed_students_count = 0
        total_progress_sum = 0.0
        if total_pub > 0 and enrolled_count > 0:
            student_ids = [e.student_id for e in db.query(Enrollment.student_id).filter(Enrollment.course_id == c.id).all()]
            for s_id in student_ids:
                comp = db.query(LessonProgress).filter(
                    LessonProgress.student_id == s_id,
                    LessonProgress.lesson_id.in_(published_ids)
                ).count()
                total_progress_sum += (comp / total_pub) * 100
                if comp == total_pub:
                    completed_students_count += 1

        completion_rate = round((completed_students_count / enrolled_count) * 100, 1) if enrolled_count > 0 else 0.0
        avg_progress = round(total_progress_sum / enrolled_count, 1) if enrolled_count > 0 else 0.0

        course_stats.append(CourseStatItem(
            course_id=c.id,
            title=c.title,
            total_enrolled=enrolled_count,
            published_lessons_count=total_pub,
            completed_students_count=completed_students_count,
            completion_rate_percentage=completion_rate,
            average_progress_percentage=avg_progress
        ))

    return AdminStatsOut(
        total_users=total_users,
        users_by_role=users_by_role,
        total_courses=total_courses,
        total_enrollments=total_enrollments,
        course_stats=course_stats
    )
