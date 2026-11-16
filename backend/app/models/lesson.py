import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    Enum, ForeignKey, TIMESTAMP, Index, func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class LessonStatus(str, enum.Enum):
    draft     = "draft"
    published = "published"


class Lesson(Base):
    __tablename__ = "lessons"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    course_id  = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title      = Column(String(200), nullable=False)
    content    = Column(Text(4294967295), nullable=True)   # LONGTEXT
    video_url  = Column(String(500), nullable=True)
    position   = Column(Integer, nullable=False)
    status     = Column(Enum(LessonStatus), nullable=False, default=LessonStatus.draft)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    course    = relationship("Course",   back_populates="lessons")
    materials = relationship("Material", back_populates="lesson", cascade="all, delete-orphan")
    # Progress rows kept even if lesson content changes (RESTRICT handled on DB side)
    progress  = relationship("LessonProgress", back_populates="lesson")

    __table_args__ = (
        # Ordered lesson retrieval per course uses this index
        Index("ix_lessons_course_position", "course_id", "position"),
    )
