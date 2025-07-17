from fastapi import APIRouter, HTTPException
from . import service
from .schemas import ScoreSchema
from app.models import ScoreAnalysis, ScoreAnalysisPublic
from app.api.deps import SessionDep
import json

# router = APIRouter()
router = APIRouter(prefix="/score", tags=["score"])

# @router.get("/hello")
# def hello_score():
#     return {"msg": "Hello from score!"}

# @router.post("/analyse", response_model=ResponseSchema)
@router.post("/score_analyse")
async def analyse_score(job_candidate_data: ScoreSchema, session: SessionDep = None):
    result = service.analyse_score(job_candidate_data=job_candidate_data)
    return result

@router.post("/save_score_analysis")
async def save_score_analysis(
    job_id: str,
    candidate_file_name: str,
    score_result: dict,
    session: SessionDep = None
):
    """
    Save score analysis result to the database.
    """
    # Create new score analysis record
    score_analysis = ScoreAnalysis(
        job_id=job_id,
        candidate_file_name=candidate_file_name,
        score_result=json.dumps(score_result)
    )
    session.add(score_analysis)
    session.commit()
    session.refresh(score_analysis)
    
    return score_analysis

@router.get("/score_analysis/{job_id}", response_model=list[ScoreAnalysisPublic])
async def get_score_analysis_by_job(job_id: str, session: SessionDep = None):
    """
    Retrieve all score analysis results for a specific job.
    """
    score_analyses = session.query(ScoreAnalysis).filter(
        ScoreAnalysis.job_id == job_id
    ).all()
    
    return score_analyses

@router.get("/score_analysis/{job_id}/{candidate_file_name}", response_model=ScoreAnalysisPublic)
async def get_score_analysis_by_job_and_candidate(
    job_id: str, 
    candidate_file_name: str, 
    session: SessionDep = None
):
    """
    Retrieve score analysis result for a specific job and candidate file.
    """
    score_analysis = session.query(ScoreAnalysis).filter(
        ScoreAnalysis.job_id == job_id,
        ScoreAnalysis.candidate_file_name == candidate_file_name
    ).first()
    
    if not score_analysis:
        raise HTTPException(status_code=404, detail="Score analysis not found")
    
    return score_analysis
