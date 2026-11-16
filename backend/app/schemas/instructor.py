from pydantic import BaseModel, field_validator, ConfigDict
from app.models.course import CourseStatus
from app.models.lesson import LessonStatus
from datetime import datetime


# ── Lesson Schemas ────────────────────────────────────────────────────────────

class LessonCreate(BaseModel):
    title: str
    content: str | None = None
    video_url: str | None = None
    status: LessonStatus = LessonStatus.draft

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Lesson title cannot be empty")
        return v.strip()


class LessonUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    video_url: str | None = None
    status: LessonStatus | None = None


class LessonReorderRequest(BaseModel):
    lesson_ids: list[int]


class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    original_name: str
    mime_type: str
    size_bytes: int
    uploaded_at: datetime


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    title: str
    content: str | None
    video_url: str | None
    position: int
    status: LessonStatus
    created_at: datetime
    updated_at: datetime
    materials: list[MaterialOut] = []


# ── Course Publish/Status Schema ──────────────────────────────────────────────

class CoursePublishUpdate(BaseModel):
    status: CourseStatus


# ── Student Progress Details ──────────────────────────────────────────────────

class LessonProgressDetail(BaseModel):
    lesson_id: int
    title: str
    position: int
    is_completed: bool
    completed_at: datetime | None = None


class StudentProgressOut(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    course_id: int
    course_title: str
    total_published_lessons: int
    completed_lessons_count: int
    progress_percentage: float
    lessons: list[LessonProgressDetail]
