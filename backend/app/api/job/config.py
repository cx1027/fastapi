from pydantic_settings import BaseSettings


class JobConfig(BaseSettings):
    MODEL_NAME: str = "llama-3.1-8b-instant"


job_config = JobConfig()
