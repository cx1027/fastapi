# from fastapi import APIRouter, File, UploadFile
# from candidate import service

# router = APIRouter()


# # @router.post("/analyse", response_model=ResponseSchema)
# @router.post("/analyse_candidate")
# async def analyse_candidate(file: UploadFile = File(...)):
#     # if file.content_type != 'application/json':
#     #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wow, That's not allowed")

#     file_name = await service.save_cv_candidate(file=file)

#     cv_content = service.read_cv_candidate(file_name=file_name)

#     result = service.analyse_candidate(cv_content=cv_content)

#     return result

from fastapi import APIRouter, UploadFile, File, HTTPException
from .service import save_cv_candidate, read_cv_candidate, analyse_candidate
from app.api.deps import SessionDep
from app.models import CandidateAnalysis, CandidateAnalysisPublic
import json

router = APIRouter()

@router.post("/analyse_candidate")
async def analyse_candidate_cv(file: UploadFile = File(...), session: SessionDep = None):
    """
    Save a CV file to the candidate upload directory and analyze it.
    """
    file_name = await save_cv_candidate(file)
    print("file_name", file_name)

    cv_content = read_cv_candidate(file_name=file_name)
    print("cv_content\n")

    result = analyse_candidate(cv_content=cv_content)
    print("analyse_candidate result:\n", result)
    
    # Store the analysis result in the database
    analysis_record = CandidateAnalysis(
        file_name=file_name,  # Timestamped filename
        original_file_name=file.filename,  # Original filename
        analysis_result=json.dumps(result)
    )
    session.add(analysis_record)
    session.commit()
    session.refresh(analysis_record)

    return result

@router.get("/analysis_result/{file_name}", response_model=CandidateAnalysisPublic)
async def get_candidate_analysis_result(file_name: str, session: SessionDep = None):
    """
    Retrieve analysis result for a specific file from the database.
    Can search by either timestamped filename or original filename.
    """
    # First try to find by timestamped filename
    analysis_record = session.query(CandidateAnalysis).filter(
        CandidateAnalysis.file_name == file_name
    ).first()
    
    # If not found, try to find by original filename
    if not analysis_record:
        analysis_record = session.query(CandidateAnalysis).filter(
            CandidateAnalysis.original_file_name == file_name
        ).first()
    
    if not analysis_record:
        raise HTTPException(status_code=404, detail="Analysis result not found for this file")
    
    return analysis_record
