from fastapi import APIRouter, UploadFile, File
from .service import save_cv_candidate

router = APIRouter()

@router.post("/save-cv")
async def save_cv(file: UploadFile = File(...)):
    """
    Save a CV file to the candidate upload directory.
    """
    file_name = await save_cv_candidate(file)
    return {"file_name": file_name} 