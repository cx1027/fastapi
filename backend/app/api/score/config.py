from pydantic_settings import BaseSettings


class ScoreConfig(BaseSettings):
    MODEL_NAME: str = "llama-3.1-8b-instant"


score_config = ScoreConfig()
