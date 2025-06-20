from pydantic_settings import BaseSettings


class ScoreConfig(BaseSettings):
    MODEL_NAME: str = "llama-3.3-70b-versatile"


score_config = ScoreConfig()
