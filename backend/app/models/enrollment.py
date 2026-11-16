from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    student_id  = Column(Integer, ForeignKey("users.id",   ondelete="CASCADE"),  nullable=False, index=True)
    # RESTRICT: cannot delete a course that has active enrollments
    course_id   = Column(Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False, index=True)
    enrolled_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("User",   back_populates="enrollments",   foreign_keys=[student_id])
    course  = relationship("Course", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("student_id", "course_id", name="uq_enrollment_student_course"),
    )
