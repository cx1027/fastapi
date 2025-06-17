from fastapi import APIRouter

from app.api.routes import auth, items, jobs, users
from app.api.job import router
from app.api.candidate import router as candidate_router

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(items.router)
api_router.include_router(jobs.router)
api_router.include_router(candidate_router, prefix="/candidate", tags=["candidate"])