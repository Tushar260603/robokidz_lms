import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Enum,
    ForeignKey, TIMESTAMP, Index, func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class CourseStatus(str, enum.Enum):
    draft     = "draft"
    published = "published"


class Course(Base):
    __tablename__ = "courses"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    # SET NULL when a category is deleted so orphan courses survive
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    status      = Column(Enum(CourseStatus), nullable=False, default=CourseStatus.draft, index=True)
    is_active   = Column(Boolean, nullable=False, default=True)
    created_by  = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at  = Column(TIMESTAMP, server_default=func.now())
    updated_at  = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    category     = relationship("Category", back_populates="courses")
    creator      = relationship("User", back_populates="created_courses", foreign_keys=[created_by])
    instructors  = relationship("CourseInstructor", back_populates="course", cascade="all, delete-orphan")
    lessons      = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    enrollments  = relationship("Enrollment", back_populates="course")

    # Composite index used by student course-listing queries (filter by status + active)
    __table_args__ = (
        Index("ix_courses_status_active", "status", "is_active"),
        # FULLTEXT index for search on title + description (MySQL InnoDB)
        Index("ix_courses_fulltext", "title", "description", mysql_prefix="FULLTEXT"),
    )
