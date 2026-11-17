from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from app.models.user import RoleEnum
from app.models.course import CourseStatus
from datetime import datetime


# ── User Schemas ─────────────────────────────────────────────────────────────

class AdminUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum
    bio: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("role")
    @classmethod
    def restrict_roles(cls, v: RoleEnum) -> RoleEnum:
        if v not in [RoleEnum.student, RoleEnum.instructor]:
            raise ValueError("Admin can only create student or instructor accounts")
        return v


class AdminUserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    bio: str | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def validate_opt_password(cls, v: str | None) -> str | None:
        if v is not None and len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserStatusUpdate(BaseModel):
    is_active: bool


# ── Category Schemas ─────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Category name cannot be empty")
        return v.strip()


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── Course Schemas ───────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    title: str
    description: str | None = None
    category_id: int | None = None
    status: CourseStatus = CourseStatus.draft

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Course title cannot be empty")
        return v.strip()


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: int | None = None
    status: CourseStatus | None = None


class CourseStatusUpdate(BaseModel):
    is_active: bool


class AssignInstructorsRequest(BaseModel):
    instructor_ids: list[int]


class InstructorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str


class EnrolledStudentOut(BaseModel):
    id: int
    name: str
    email: str
    enrolled_at: datetime
    progress_percentage: float = 0.0


class CourseDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    category_id: int | None
    category_name: str | None = None
    status: CourseStatus
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime
    instructors: list[InstructorOut] = []
    enrolled_students: list[EnrolledStudentOut] = []


class CourseListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    category_id: int | None
    category_name: str | None = None
    status: CourseStatus
    is_active: bool
    created_by: int
    created_at: datetime
    enrollments_count: int = 0


# ── Stats Schemas ────────────────────────────────────────────────────────────

class CourseStatItem(BaseModel):
    course_id: int
    title: str
    total_enrolled: int
    published_lessons_count: int
    completed_students_count: int
    completion_rate_percentage: float
    average_progress_percentage: float = 0.0


class AdminStatsOut(BaseModel):
    total_users: int
    users_by_role: dict[str, int]
    total_courses: int
    total_enrollments: int
    course_stats: list[CourseStatItem]


# ── Generic Pagination Wrapper ────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
