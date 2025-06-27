from pydantic import BaseModel, EmailStr
from models.user import RoleEnum


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: str
    role: RoleEnum


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: str
    role: RoleEnum

    class Config:
        from_attributes = True
