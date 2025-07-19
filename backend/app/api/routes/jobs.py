import uuid
from typing import Any
from datetime import date

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Job, JobCreate, JobPublic, JobsPublic, JobUpdate, JobResponseSchema, Message, JobAnalyzeRequest

from ..job import service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/", response_model=JobsPublic)
def read_jobs(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    title: str | None = None,
    description: str | None = None,
    created_at: date | None = None,
) -> Any:
    """
    Retrieve jobs.
    """
    base_statement = select(Job)
    count_statement = select(func.count()).select_from(Job)

    if not current_user.is_superuser:
        base_statement = base_statement.where(Job.owner_id == current_user.id)
        count_statement = count_statement.where(Job.owner_id == current_user.id)

    if title:
        base_statement = base_statement.where(func.lower(Job.title).like(f"%{title.lower()}%"))
        count_statement = count_statement.where(func.lower(Job.title).like(f"%{title.lower()}%"))

    if description:
        base_statement = base_statement.where(
            func.lower(Job.description).like(f"%{description.lower()}%")
        )
        count_statement = count_statement.where(
            func.lower(Job.description).like(f"%{description.lower()}%")
        )

    if created_at:
        base_statement = base_statement.where(func.date(Job.created_at) == created_at)
        count_statement = count_statement.where(func.date(Job.created_at) == created_at)

    # Add sorting by created_at in descending order (newest first)
    base_statement = base_statement.order_by(Job.created_at.desc())

    count = session.exec(count_statement).one()
    statement = base_statement.offset(skip).limit(limit)
    jobs = session.exec(statement).all()

    return JobsPublic(data=jobs, count=count)


@router.get("/{id}", response_model=JobPublic)
def read_job(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get job by ID.
    """
    job = session.get(Job, id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not current_user.is_superuser and (job.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return job


@router.post("/", response_model=JobPublic)
def create_job(
    *, session: SessionDep, current_user: CurrentUser, job_in: JobCreate
) -> Any:
    """
    Create new job.
    """
    job = Job.model_validate(job_in, update={"owner_id": current_user.id})
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


@router.put("/{id}", response_model=JobPublic)
def update_job(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    job_in: JobUpdate,
) -> Any:
    """
    Update a job.
    """
    job = session.get(Job, id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not current_user.is_superuser and (job.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = job_in.model_dump(exclude_unset=True)
    job.sqlmodel_update(update_dict)
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


@router.delete("/{id}", response_model=Message)
def delete_job(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """
    Delete a job.
    """
    job = session.get(Job, id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not current_user.is_superuser and (job.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(job)
    session.commit()
    return Message(message="Job deleted successfully")

# @router.post("/analyse", response_model=JobResponseSchema)
# async def analyse_job(job_data: JobAnalyzeRequest):
#     result = service.analyse_job(job_data=job_data)
#     return result
