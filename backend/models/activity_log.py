from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from database.db import Base
from sqlalchemy.types import JSON
from datetime import datetime

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)  
    target = Column(String, nullable=True)
    details = Column(JSON, nullable=True) 
    timestamp = Column(DateTime, default=datetime.utcnow)