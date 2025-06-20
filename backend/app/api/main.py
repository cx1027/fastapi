from fastapi import APIRouter

from app.api.routes import items, jobs, login, private, users, utils
from app.api.candidate import router as candidate_router
from app.api.score import router as score_router
from app.api.job import router as job_router
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(jobs.router)
api_router.include_router(candidate_router, prefix="/candidate", tags=["candidate"])
api_router.include_router(score_router.router)
api_router.include_router(job_router.router, prefix="/job", tags=["job"])

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
