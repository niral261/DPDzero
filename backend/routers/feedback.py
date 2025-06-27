from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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
from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from schemas.feedback import FeedbackEdit


router = APIRouter()


@router.post("/feedback", response_model=FeedbackOut)
async def create_feedback(feedback: FeedbackCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new feedback entry.
    """
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
    """
    Get all feedbacks for a specific user.
    """
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
    """
    Create a feedback request for an employee from their manager.
    """
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


@router.put("/feedback/{feedback_id}/acknowledge")
async def acknowledge_feedback(feedback_id: int, db: AsyncSession = Depends(get_db)):
    """
    Mark a feedback as acknowledged by the employee.
    """
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


@router.put("/feedback_request/complete", response_model=FeedbackRequestOut)
async def complete_feedback_request(
    data: FeedbackRequestComplete, db: AsyncSession = Depends(get_db)
):
    """
    Mark a feedback request as completed for an employee-manager pair.
    """
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


@router.get("/feedback/{feedback_id}/export-pdf")
async def export_feedback_pdf(feedback_id: int, db: AsyncSession = Depends(get_db)):
    """
    Export a feedback entry as a PDF file.
    """
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    manager_result = await db.execute(select(User).where(User.id == feedback.given_by))
    manager = manager_result.scalar_one_or_none()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    print(feedback)
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
            "Content-Disposition": f"attachment; filename=feedback_from_{manager.name}_to_{feedback.member}.pdf"
        },
    )


@router.put("/feedback/{feedback_id}", response_model=FeedbackSchema)
async def edit_feedback(
    feedback_id: int,
    data: FeedbackEdit,
    db: AsyncSession = Depends(get_db),
    user_id: int = None,
):
    """
    Edit an existing feedback entry. Only the user who gave the feedback can edit it.
    """
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if user_id is not None and feedback.given_by != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to edit this feedback"
        )
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
