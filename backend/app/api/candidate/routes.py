from fastapi import APIRouter, UploadFile, File
from .service import save_cv_candidate, read_cv_candidate, analyse_candidate

router = APIRouter()

@router.post("/save-cv")
async def save_cv(file: UploadFile = File(...)):
    """
    Save a CV file to the candidate upload directory.
    """
    file_name = await save_cv_candidate(file)
    # return {"file_name": file_name} 
    print("file_name", file_name)

    cv_content = read_cv_candidate(file_name=file_name)
    print("cv_content\n")

    result = analyse_candidate(cv_content=cv_content)
    print("result: ", result)

    return result