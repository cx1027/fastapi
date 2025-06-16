# from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel


# class JobSchema(BaseModel):
#     job_name: str
#     job_description: str


class ResponseSchema(SQLModel):
    degree: list
    experience: list
    technical_skill: list
    responsibility: list
    certificate: list
    soft_skill: list

# class JobBase(SQLModel):
#     title: str = Field(min_length=1, max_length=255)
#     description: str | None = Field(default=None, max_length=255)