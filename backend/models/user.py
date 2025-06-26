from sqlalchemy import Column, Integer, String, Enum
from database.db import Base
from enum import Enum as PyEnum


class RoleEnum(str, PyEnum):
    manager = "manager"
    employee = "employee"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    company = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)