from pydantic import BaseModel
from datetime import datetime


class ActivityLogCreate(BaseModel):
    user_id: int
    manager_id: int | None = None
    action: str
    target: str | None = None
    details: dict | None = None

class ActivityLogSchema(BaseModel):
    id: int
    user_id: int
    manager_id: int | None = None
    action: str
    target: str | None = None
    details: dict | None = None
    timestamp: datetime

    class Config:
        from_attributes = True