from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Text, DateTime
from database.db import Base
from sqlalchemy.types import JSON
from datetime import datetime


class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    member = Column(String, nullable=False)
    strengths = Column(Text, nullable=False)
    improvement = Column(Text, nullable=False)
    sentiment = Column(String, nullable=False)
    tags = Column(JSON, nullable=True)
    given_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FeedbackRequest(Base):
    __tablename__ = "feedback_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending") 