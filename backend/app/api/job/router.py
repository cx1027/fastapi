from fastapi import APIRouter, Depends
from . import service
# from .models import JobBase
from app.models import JobBase, JobResponseSchema, JobAnalyzeRequest, Job
from app.api.deps import get_db  # or SessionDep if that's your alias
from sqlalchemy.orm import Session
import json

router = APIRouter()


# @router.post("/analyse", response_model=ResponseSchema)
# @router.post("/analyse")
# async def analyse_job(job_data: JobBase):
#     result = service.analyse_job(job_data=job_data)

#     return result

@router.post("/analyse_job", response_model=JobResponseSchema)
async def analyse_job(job_data: JobAnalyzeRequest, session: Session = Depends(get_db)):
    result = service.analyse_job(job_data=job_data)
    # Save result to job
    job = session.get(Job, job_data.id)
    if job:
        job.analysis_result = json.dumps(result)
        session.add(job)
        session.commit()
        session.refresh(job)
    print("job result:\n", result)
    return result  # <-- return the analysis result dict
