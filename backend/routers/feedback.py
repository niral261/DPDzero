from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from database.db import get_db
from models.feedback import Feedback
from models.user import User
from models.feedback import FeedbackRequest
from schemas.feedback import (
    FeedbackCreate,
    FeedbackOut,
    FeedbackRequestOut,
    FeedbackRequestComplete,
    FeedbackSchema,
)
from models.activity_log import ActivityLog
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from schemas.feedback import FeedbackEdit

router = APIRouter()


@router.post("/feedback", response_model=FeedbackOut)
async def create_feedback(feedback: FeedbackCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_feedback = Feedback(**feedback.dict())
        db.add(db_feedback)
        await db.commit()
        await db.refresh(db_feedback)

        db_log = ActivityLog(
            user_id=feedback.given_by,
            action="sent_feedback",
            target=feedback.member,
            details={"feedback_id": db_feedback.id},
            manager_id=feedback.given_by,
        )
        db.add(db_log)
        await db.commit()
        await db.refresh(db_log)
        return db_feedback
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to load feedback into database: {str(e)}"
        )


@router.get("/feedback", response_model=list[FeedbackOut])
async def get_feedbacks(
    user: str = Query(..., description="ID of the user whose feedbacks to fetch"),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(select(Feedback).where(Feedback.member == user))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch feedbacks: {str(e)}"
        )


@router.post("/feedback/request", response_model=FeedbackRequestOut)
async def create_request_feedback(
    member: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)
):
    emp_result = await db.execute(
        select(User).where(User.name == member, User.role == "employee")
    )
    emp = emp_result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    mgr_result = await db.execute(
        select(User).where(User.company == emp.company, User.role == "manager")
    )
    mgr = mgr_result.scalar_one_or_none()
    if not mgr:
        raise HTTPException(
            status_code=404, detail="Manager not found for this company"
        )

    try:
        db_request = FeedbackRequest(
            employee_id=emp.id, manager_id=mgr.id, status="pending"
        )
        db.add(db_request)
        await db.commit()
        await db.refresh(db_request)

        db_log = ActivityLog(
            user_id=emp.id,
            action="requested_feedback",
            target=str(mgr.id),
            details={"request_id": db_request.id},
            manager_id=mgr.id,
        )
        db.add(db_log)
        await db.commit()
        await db.refresh(db_log)
        return db_request
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create feedback request: {str(e)}"
        )


@router.get("/manager/{manager_id}/employees")
async def get_employees_under_manager(
    manager_id: int, db: AsyncSession = Depends(get_db)
):
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


@router.get("/employee/{employee_name}/feedbacks", response_model=list[FeedbackOut])
async def get_employee_feedbacks(
    employee_name: str, db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Feedback).where(Feedback.member == employee_name)
        )
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch feedbacks: {str(e)}"
        )


@router.put("/feedback/{feedback_id}/acknowledge")
async def acknowledge_feedback(feedback_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    feedback.acknowledged = True
    await db.commit()

    emp_result = await db.execute(select(User).where(User.name == feedback.member))
    emp = emp_result.scalar_one_or_none()
    if emp:
        db_log = ActivityLog(
            user_id=emp.id,
            action="acknowledged_feedback",
            target=str(feedback.id),
            details={"feedback_id": feedback.id},
            manager_id=feedback.given_by,
        )
        db.add(db_log)
        await db.commit()
        await db.refresh(db_log)
    return {"message": "Feedback acknowledged"}


@router.get("/manager/{manager_id}/feedbacks/count")
async def total_feedback_given(manager_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.count())
        .select_from(Feedback)
        .where(Feedback.given_by == manager_id)
    )
    count = result.scalar()
    return {"total_feedback_given": count}


@router.get("/manager/{manager_id}/team/response-rate")
async def team_response_rate(manager_id: int, db: AsyncSession = Depends(get_db)):
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
    result = await db.execute(
        select(func.count())
        .select_from(Feedback)
        .where(Feedback.given_by == manager_id, Feedback.acknowledged == False)
    )
    count = result.scalar()
    return {"pending_acknowledgments": count}


@router.put("/feedback_request/complete", response_model=FeedbackRequestOut)
async def complete_feedback_request(
    data: FeedbackRequestComplete, db: AsyncSession = Depends(get_db)
):
    employee = data.employee
    manager_id = data.manager_id
    emp_result = await db.execute(
        select(User).where(User.name == employee, User.role == "employee")
    )
    emp = emp_result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    result = await db.execute(
        select(FeedbackRequest)
        .where(
            FeedbackRequest.employee_id == emp.id,
            FeedbackRequest.manager_id == manager_id,
            FeedbackRequest.status == "pending",
        )
        .limit(1)
    )
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(
            status_code=404, detail="Pending feedback request not found"
        )
    req.status = "completed"
    await db.commit()
    await db.refresh(req)
    return req


@router.get("/employee/{employee_id}/feedbacks/count")
async def feedback_received_employee(
    employee_id: int, db: AsyncSession = Depends(get_db)
):
    emp_result = await db.execute(select(User).where(User.id == employee_id))
    emp = emp_result.scalar_one_or_none()
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

    # Query all feedbacks given by this manager in the last 12 months
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


@router.get("/feedback/{feedback_id}/export-pdf")
async def export_feedback_pdf(feedback_id: int, db: AsyncSession = Depends(get_db)):
    manager_result = await db.execute(select(User).where(User.id == feedback.given_by))
    manager = manager_result.scalar_one_or_none()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(72, 750, f"Feedback Report (ID: {feedback.id})")
    p.setFont("Helvetica", 12)
    y = 720
    p.drawString(72, y, f"Member: {feedback.member}")
    y -= 20
    p.drawString(72, y, f"Strengths: {feedback.strengths}")
    y -= 20
    p.drawString(72, y, f"Improvement: {feedback.improvement}")
    y -= 20
    p.drawString(72, y, f"Sentiment: {feedback.sentiment}")
    y -= 20
    tags = feedback.tags if isinstance(feedback.tags, list) else []
    p.drawString(72, y, f"Tags: {', '.join(tags) if tags else '-'}")
    y -= 20
    p.drawString(72, y, f"Given By: {manager.name}")
    y -= 20
    p.drawString(
        72, y, f"Acknowledged: {'Yes' if bool(feedback.acknowledged) else 'No'}"
    )
    y -= 20
    created_at_str = (
        feedback.created_at.strftime("%Y-%m-%d %H:%M:%S")
        if feedback.created_at
        else "-"
    )
    p.drawString(72, y, f"Created At: {created_at_str}")
    p.showPage()
    p.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=feedback_{feedback.id}.pdf"
        },
    )


@router.get("/manager/{manager_id}/feedbacks-given", response_model=list[FeedbackSchema])
async def get_feedbacks_given_by_manager(manager_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Feedback)
        .where(Feedback.given_by == manager_id)
        .order_by(desc(Feedback.created_at))
    )
    feedbacks = result.scalars().all()
    return feedbacks


@router.put("/feedback/{feedback_id}", response_model=FeedbackSchema)
async def edit_feedback(feedback_id: int, data: FeedbackEdit, db: AsyncSession = Depends(get_db), user_id: int = None):

    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if user_id is not None and feedback.given_by != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this feedback")
    if data.strengths is not None:
        feedback.strengths = data.strengths
    if data.improvement is not None:
        feedback.improvement = data.improvement
    if data.sentiment is not None:
        feedback.sentiment = data.sentiment
    if data.tags is not None:
        feedback.tags = data.tags
    if data.acknowledged is not None:
        feedback.acknowledged = data.acknowledged
    await db.commit()
    await db.refresh(feedback)
    return feedback
