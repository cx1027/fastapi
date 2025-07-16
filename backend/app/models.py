import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    jobs: list["Job"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Shared properties
class JobBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10000)


# Properties to receive on job creation
class JobCreate(JobBase):
    title: str = Field(min_length=1, max_length=255)  # type: ignore
    description: str | None = Field(default=None, max_length=10000)  # type: ignore
    files: str | None = Field(default=None, max_length=1000)  # type: ignore


# Properties to receive on job update
class JobUpdate(JobBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    description: str | None = Field(default=None, max_length=10000)  # type: ignore
    files: str | None = Field(default=None, max_length=1000)  # type: ignore
    analysis_result: str | None = Field(default=None, max_length=10000)  # type: ignore


# Database model, database table inferred from class name
class Job(JobBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="jobs")
    files: str | None = Field(default=None, max_length=1000)  # type: ignore
    analysis_result: str | None = Field(default=None, max_length=10000)  # New field for analysis result
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Database model for candidate analysis results
class CandidateAnalysis(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    file_name: str = Field(max_length=255, unique=True, index=True)  # Timestamped filename
    original_file_name: str | None = Field(default=None, max_length=255, index=True)  # Original filename
    analysis_result: str = Field(max_length=10000)  # JSON string of analysis result
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Database model for score analysis results
class ScoreAnalysis(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    job_id: uuid.UUID = Field(foreign_key="job.id", nullable=False, ondelete="CASCADE")
    candidate_file_name: str = Field(max_length=255, index=True)  # Candidate file name
    score_result: str = Field(max_length=10000)  # JSON string of score analysis result
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Properties to return via API, id is always required
class JobPublic(JobBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    files: str | None = Field(default=None, max_length=1000)  # type: ignore
    analysis_result: str | None = Field(default=None, max_length=10000)  # New field for analysis result
    created_at: datetime


class JobsPublic(SQLModel):
    data: list[JobPublic]
    count: int


# Properties to return via API for candidate analysis
class CandidateAnalysisPublic(SQLModel):
    id: uuid.UUID
    file_name: str
    original_file_name: str | None
    analysis_result: str
    created_at: datetime
    updated_at: datetime


# Properties to return via API for score analysis
class ScoreAnalysisPublic(SQLModel):
    id: uuid.UUID
    job_id: uuid.UUID
    candidate_file_name: str
    score_result: str
    created_at: datetime
    updated_at: datetime


class JobResponseSchema(SQLModel):
    degree: list
    experience: list
    technical_skill: list
    responsibility: list
    certificate: list
    soft_skill: list


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class JobAnalyzeRequest(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    id: uuid.UUID | None = None
    owner_id: uuid.UUID | None = None
    files: str | None = Field(default=None, max_length=1000)
