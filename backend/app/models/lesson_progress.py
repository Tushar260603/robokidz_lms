from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    student_id   = Column(Integer, ForeignKey("users.id",    ondelete="CASCADE"),  nullable=False, index=True)
    # RESTRICT: progress history must not be deleted even if lesson is updated
    lesson_id    = Column(Integer, ForeignKey("lessons.id",  ondelete="RESTRICT"), nullable=False, index=True)
    completed_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("User",   back_populates="progress", foreign_keys=[student_id])
    lesson  = relationship("Lesson", back_populates="progress")

    __table_args__ = (
        UniqueConstraint("student_id", "lesson_id", name="uq_progress_student_lesson"),
    )
