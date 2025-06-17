from pydantic_settings import BaseSettings
import os
from pathlib import Path
from typing import ClassVar


class CandidateConfig(BaseSettings):
    MODEL_NAME: str = "llama-3.3-70b-versatile"

    # Get the absolute path to the upload directory
    BASE_DIR: ClassVar[Path] = Path(__file__).parents[3]  # Go up to the backend directory
    CV_UPLOAD_DIR: str = str(BASE_DIR / "upload" / "candidate" / "")


candidate_config = CandidateConfig()
