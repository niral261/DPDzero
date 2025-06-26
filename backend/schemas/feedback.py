from pydantic import BaseModel
from typing import List, Optional

class FeedbackCreate(BaseModel):
    member: str
    strengths: str
    improvement: str
    sentiment: str
    tags: Optional[List[str]] = []
    given_by: int
    acknowledged: bool

class FeedbackOut(BaseModel):
    id: int
    member: str
    strengths: str
    improvement: str
    sentiment: str
    tags: Optional[List[str]] = []
    given_by: int
    acknowledged: bool
    
    class Config:
        from_attributes = True
        
class FeedbackRequestCreate(BaseModel):
    employee_id: int
    manager_id:int
    status: str = "pending"
    
class FeedbackRequestOut(BaseModel):
    id: int
    employee_id: int
    manager_id: int
    status: str
    
    class Config:
        from_attributes = True
        
class FeedbackRequestComplete(BaseModel):
    employee: str
    manager_id: int

class FeedbackSchema(BaseModel):
    id: int
    member: str
    strengths: str
    improvement: str
    sentiment: str
    tags: Optional[List[str]] = []
    given_by: int
    acknowledged: bool

    class Config:
        from_attributes = True

class FeedbackEdit(BaseModel):
    strengths: Optional[str] = None
    improvement: Optional[str] = None
    sentiment: Optional[str] = None
    tags: Optional[list[str]] = None
    acknowledged: Optional[bool] = None
    
    class Config:
        from_attributes = True
