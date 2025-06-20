from fastapi import APIRouter
from . import service
# from .models import JobBase
from app.models import JobBase, JobResponseSchema, JobAnalyzeRequest

router = APIRouter()


# @router.post("/analyse", response_model=ResponseSchema)
# @router.post("/analyse")
# async def analyse_job(job_data: JobBase):
#     result = service.analyse_job(job_data=job_data)

#     return result

@router.post("/analyse_job", response_model=JobResponseSchema)
async def analyse_job(job_data: JobAnalyzeRequest):
    result = service.analyse_job(job_data=job_data)
    return result
