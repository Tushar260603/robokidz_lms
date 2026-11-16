import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    Enum, TIMESTAMP, func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    instructor = "instructor"
    student = "student"


class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    name           = Column(String(100), nullable=False)
    email          = Column(String(150), nullable=False, unique=True)
    password_hash  = Column(String(255), nullable=False)
    role           = Column(Enum(RoleEnum), nullable=False, index=True)
    bio            = Column(Text, nullable=True)
    is_active      = Column(Boolean, nullable=False, default=True)
    created_at     = Column(TIMESTAMP, server_default=func.now())
    updated_at     = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Courses this user created (admin creates courses)
    created_courses = relationship("Course", back_populates="creator", foreign_keys="Course.created_by")

    # Courses this instructor is assigned to (via junction table)
    assigned_courses = relationship("CourseInstructor", back_populates="instructor")

    # Enrollments (student side)
    enrollments = relationship("Enrollment", back_populates="student", foreign_keys="Enrollment.student_id")

    # Lesson progress (student side)
    progress = relationship("LessonProgress", back_populates="student", foreign_keys="LessonProgress.student_id")

    # Materials uploaded by this user
    uploaded_materials = relationship("Material", back_populates="uploader", foreign_keys="Material.uploaded_by")
