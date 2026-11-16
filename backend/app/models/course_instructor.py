from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class CourseInstructor(Base):
    __tablename__ = "course_instructors"

    course_id     = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    instructor_id = Column(Integer, ForeignKey("users.id",   ondelete="CASCADE"), primary_key=True)
    assigned_at   = Column(TIMESTAMP, server_default=func.now())

    course     = relationship("Course", back_populates="instructors")
    instructor = relationship("User",   back_populates="assigned_courses")
