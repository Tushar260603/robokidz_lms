from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    lesson_id     = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    original_name = Column(String(255), nullable=False)
    stored_name   = Column(String(255), nullable=False, unique=True)   # UUID filename on disk
    mime_type     = Column(String(100), nullable=False)
    size_bytes    = Column(BigInteger, nullable=False)
    uploaded_by   = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_at   = Column(TIMESTAMP, server_default=func.now())

    lesson   = relationship("Lesson", back_populates="materials")
    uploader = relationship("User",   back_populates="uploaded_materials", foreign_keys=[uploaded_by])
