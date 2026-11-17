from pydantic import BaseModel, ConfigDict
from app.models.course import CourseStatus
from app.models.lesson import LessonStatus
from datetime import datetime


class StudentCourseListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    category_id: int | None
    category_name: str | None = None
    status: CourseStatus
    is_active: bool
    created_at: datetime
    instructors: list[str] = []
    total_lessons: int = 0
    is_enrolled: bool = False


class LessonPreviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    position: int
    has_video: bool = False
    materials_count: int = 0


class StudentCourseDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    category_id: int | None
    category_name: str | None = None
    status: CourseStatus
    is_active: bool
    created_at: datetime
    instructors: list[str] = []
    total_lessons: int = 0
    is_enrolled: bool = False
    progress_percentage: float = 0.0
    lessons: list[LessonPreviewOut] = []


class StudentMaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    original_name: str
    mime_type: str
    size_bytes: int


class StudentLessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    title: str
    content: str | None
    video_url: str | None
    position: int
    is_completed: bool = False
    completed_at: datetime | None = None
    materials: list[StudentMaterialOut] = []


class StudentEnrolledCourseItem(BaseModel):
    id: int
    title: str
    description: str | None
    category_name: str | None = None
    instructors: list[str] = []
    total_lessons: int = 0
    completed_lessons: int = 0
    progress_percentage: float = 0.0
    last_incomplete_lesson_id: int | None = None
    enrolled_at: datetime


class StudentCoursePlayer(BaseModel):
    course_id: int
    course_title: str
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    next_incomplete_lesson_id: int | None = None
    lessons: list[StudentLessonOut]
