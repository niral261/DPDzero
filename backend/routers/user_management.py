from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.db import get_db
from models.user import User
from models.feedback import Feedback, FeedbackRequest
from datetime import datetime, timedelta
from schemas.feedback import FeedbackSchema, FeedbackOut
from sqlalchemy import func, desc


router = APIRouter()


@router.get("/manager/{manager_id}/employees")
async def get_employees_under_manager(
    manager_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get all employees under a specific manager.
    """
    manager_result = await db.execute(
        select(User).where(User.id == manager_id, User.role == "manager")
    )
    manager = manager_result.scalar_one_or_none()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    employees_result = await db.execute(
        select(User).where(User.company == manager.company, User.role == "employee")
    )
    employees = employees_result.scalars().all()

    employee_data = []
    for emp in employees:
        feedbacks_result = await db.execute(
            select(func.count())
            .select_from(Feedback)
            .where(Feedback.member == emp.name, Feedback.given_by == manager_id)
        )
        given_feedbacks = feedbacks_result.scalar()
        pending_result = await db.execute(
            select(func.count())
            .select_from(FeedbackRequest)
            .where(
                FeedbackRequest.employee_id == emp.id,
                FeedbackRequest.manager_id == manager_id,
                FeedbackRequest.status == "pending",
            )
        )
        pending_feedbacks = pending_result.scalar()
        employee_data.append(
            {
                "id": emp.id,
                "name": emp.name,
                "pending_feedbacks": pending_feedbacks,
                "given_feedbacks": given_feedbacks,
            }
        )

    return employee_data


@router.get("/manager/{manager_id}/feedbacks/count")
async def total_feedback_given(manager_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get the total number of feedbacks given by a manager.
    """
    result = await db.execute(
        select(func.count())
        .select_from(Feedback)
        .where(Feedback.given_by == manager_id)
    )
    count = result.scalar()
    return {"total_feedback_given": count}


@router.get("/manager/{manager_id}/team/response-rate")
async def team_response_rate(manager_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get the response rate of a manager's team to feedback requests.
    """
    total_result = await db.execute(
        select(func.count())
        .select_from(FeedbackRequest)
        .where(FeedbackRequest.manager_id == manager_id)
    )
    total = total_result.scalar()
    if total == 0:
        return {"response_rate": 0}
    completed_result = await db.execute(
        select(func.count())
        .select_from(FeedbackRequest)
        .where(
            FeedbackRequest.manager_id == manager_id,
            FeedbackRequest.status == "completed",
        )
    )
    completed = completed_result.scalar()
    response_rate = (completed / total) * 100
    return {"response_rate": round(response_rate, 2)}


@router.get("/manager/{manager_id}/feedbacks/average-sentiment")
async def average_sentiment(manager_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get the average sentiment score of feedbacks given by a manager.
    """
    sentiment_map = {"Positive": 5, "Neutral": 3, "Negative": 1}
    result = await db.execute(
        select(Feedback.sentiment).where(Feedback.given_by == manager_id)
    )
    sentiments = result.scalars().all()
    if not sentiments:
        return {"average_sentiment": 0}
    scores = [sentiment_map.get(s, 3) for s in sentiments]
    avg_score = sum(scores) / len(scores)
    return {"average_sentiment": round(avg_score, 2)}


@router.get("/manager/{manager_id}/feedbacks/pending-ack")
async def pending_acknowledgments(manager_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get the number of feedbacks given by a manager that are pending acknowledgment.
    """
    result = await db.execute(
        select(func.count())
        .select_from(Feedback)
        .where(Feedback.given_by == manager_id, Feedback.acknowledged == False)
    )
    count = result.scalar()
    return {"pending_acknowledgments": count}


@router.get("/employee/{employee_id}/feedbacks/count")
async def feedback_received_employee(
    employee_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get the total number of feedbacks received by an employee.
    """
    print("1")
    emp_result = await db.execute(select(User).where(User.id == employee_id))
    emp = emp_result.scalar_one_or_none()
    print(emp)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    result = await db.execute(
        select(func.count()).select_from(Feedback).where(Feedback.member == emp.name)
    )
    count = result.scalar() or 0
    return {"feedback_received": count}


@router.get("/employee/{employee_id}/feedbacks/pending-ack")
async def pending_acknowledgments_employee(
    employee_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get the number of feedbacks received by an employee that are pending acknowledgment.
    """
    emp_result = await db.execute(select(User).where(User.id == employee_id))
    emp = emp_result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    result = await db.execute(
        select(func.count())
        .select_from(Feedback)
        .where(Feedback.member == emp.name, Feedback.acknowledged == False)
    )
    count = result.scalar() or 0
    return {"pending_acknowledgments": count}


@router.get("/employee/{employee_id}/feedbacks/ack-rate")
async def acknowledgment_rate_employee(
    employee_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get the acknowledgment rate of feedbacks received by an employee.
    """
    emp_result = await db.execute(select(User).where(User.id == employee_id))
    emp = emp_result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    total_result = await db.execute(
        select(func.count()).select_from(Feedback).where(Feedback.member == emp.name)
    )
    total = total_result.scalar() or 0
    if not total:
        return {"acknowledgment_rate": 0}
    ack_result = await db.execute(
        select(func.count())
        .select_from(Feedback)
        .where(Feedback.member == emp.name, Feedback.acknowledged == True)
    )
    ack = ack_result.scalar() or 0
    rate = (ack / total) * 100 if total else 0
    return {"acknowledgment_rate": round(rate, 2)}


@router.get("/employee/{employee_id}/feedbacks/average-sentiment")
async def average_sentiment_employee(
    employee_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get the average sentiment score of feedbacks received by an employee.
    """
    sentiment_map = {"Positive": 5, "Neutral": 3, "Negative": 1}
    emp_result = await db.execute(select(User).where(User.id == employee_id))
    emp = emp_result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    result = await db.execute(
        select(Feedback.sentiment).where(Feedback.member == emp.name)
    )
    sentiments = result.scalars().all()
    if not sentiments:
        return {"average_sentiment": 0}
    scores = [sentiment_map.get(s, 3) for s in sentiments]
    avg_score = sum(scores) / len(scores) if scores else 0
    return {"average_sentiment": round(avg_score, 2)}


@router.get("/manager/{manager_id}/feedbacks/sentiment-trends")
async def manager_sentiment_trends(manager_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get the sentiment trends of feedbacks given by a manager over the last 12 months.
    """
    mgr_result = await db.execute(
        select(User).where(User.id == manager_id, User.role == "manager")
    )
    mgr = mgr_result.scalar_one_or_none()
    if not mgr:
        raise HTTPException(status_code=404, detail="Manager not found")

    now = datetime.utcnow()
    months = []
    for i in range(11, -1, -1):
        month = (now.replace(day=1) - timedelta(days=30 * i)).strftime("%Y-%m")
        months.append(month)

    result = await db.execute(
        select(
            func.strftime("%Y-%m", Feedback.created_at).label("month"),
            Feedback.sentiment,
            func.count().label("count"),
        )
        .where(
            Feedback.given_by == manager_id,
            func.strftime("%Y-%m", Feedback.created_at) >= months[-1],
        )
        .group_by(func.strftime("%Y-%m", Feedback.created_at), Feedback.sentiment)
        .order_by(func.strftime("%Y-%m", Feedback.created_at))
    )
    rows = result.all()

    month_sentiment_map = {
        m: {"positive": 0, "neutral": 0, "negative": 0} for m in months
    }
    for row in rows:
        sentiment = row.sentiment.lower()
        if sentiment in month_sentiment_map[row.month]:
            month_sentiment_map[row.month][sentiment] = row.count

    data = []
    for m in months:
        entry = {"month": m}
        entry.update(month_sentiment_map[m])
        data.append(entry)
    return data


@router.get(
    "/manager/{manager_id}/feedbacks-given", response_model=list[FeedbackSchema]
)
async def get_feedbacks_given_by_manager(
    manager_id: int, db: AsyncSession = Depends(get_db)
):
    """
    Get all feedbacks given by a manager, ordered by creation date.
    """
    result = await db.execute(
        select(Feedback)
        .where(Feedback.given_by == manager_id)
        .order_by(desc(Feedback.created_at))
    )
    feedbacks = result.scalars().all()
    return feedbacks


@router.get("/employee/{employee_name}/feedbacks", response_model=list[FeedbackOut])
async def get_employee_feedbacks(
    employee_name: str, db: AsyncSession = Depends(get_db)
):
    """
    Get all feedbacks for a specific employee by name.
    """
    try:
        result = await db.execute(
            select(Feedback).where(Feedback.member == employee_name)
        )
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch feedbacks: {str(e)}"
        )
