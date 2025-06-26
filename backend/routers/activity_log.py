from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.db import get_db
from sqlalchemy import desc
from models.activity_log import ActivityLog
from models.user import User
from schemas.activity_log import ActivityLogCreate, ActivityLogSchema


router = APIRouter()


@router.post("/activity-log", response_model=ActivityLogSchema)
async def create_activity_log(
    log: ActivityLogCreate, db: AsyncSession = Depends(get_db)
):
    db_log = ActivityLog(**log)
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log


@router.get("/manager/{manager_id}/activities", response_model=list[ActivityLogSchema])
async def get_manager_activities(manager_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.manager_id == manager_id)
        .order_by(desc(ActivityLog.timestamp))
        .limit(5)
    )
    activities = result.scalars().all()
    return activities
