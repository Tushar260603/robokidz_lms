# Import all models here so Alembic's autogenerate can discover them
from app.models.user import User, RoleEnum
from app.models.category import Category
from app.models.course import Course, CourseStatus
from app.models.course_instructor import CourseInstructor
from app.models.lesson import Lesson, LessonStatus
from app.models.material import Material
from app.models.enrollment import Enrollment
from app.models.lesson_progress import LessonProgress

__all__ = [
    "User", "RoleEnum",
    "Category",
    "Course", "CourseStatus",
    "CourseInstructor",
    "Lesson", "LessonStatus",
    "Material",
    "Enrollment",
    "LessonProgress",
]
