from fastapi import APIRouter

from app.api.routes import auth, items, jobs, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(items.router)
api_router.include_router(jobs.router) 