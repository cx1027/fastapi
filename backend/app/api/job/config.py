from pydantic_settings import BaseSettings


class JobConfig(BaseSettings):
    MODEL_NAME: str = "llama-3.3-70b-versatile"


job_config = JobConfig()
