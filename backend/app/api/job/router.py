from fastapi import APIRouter
from job import service
from ..models import JobBase

router = APIRouter()


# @router.post("/analyse", response_model=ResponseSchema)
@router.post("/analyse")
async def analyse_job(job_data: JobBase):
    result = service.analyse_job(job_data=job_data)

    return result
