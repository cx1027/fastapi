from fastapi import APIRouter
from . import service
from .schemas import ScoreSchema

# router = APIRouter()
router = APIRouter(prefix="/score", tags=["score"])

# @router.get("/hello")
# def hello_score():
#     return {"msg": "Hello from score!"}

# @router.post("/analyse", response_model=ResponseSchema)
@router.post("/score_analyse")
async def analyse_score(score_data: ScoreSchema):
    result = service.analyse_score(score_data=score_data)

    return result
