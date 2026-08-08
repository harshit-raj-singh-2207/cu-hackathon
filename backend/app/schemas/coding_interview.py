from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.coding_interview import SessionStatus, CompilationStatus


class ProgrammingLanguage(str, Enum):
    JAVA = "Java"
    CPP = "C++"
    PYTHON = "Python"
    JAVASCRIPT = "JavaScript"
    TYPESCRIPT = "TypeScript"
    GO = "Go"
    CSHARP = "C#"


class CodingSessionCreate(BaseModel):
    programming_language: ProgrammingLanguage
    interview_id: Optional[str] = None


class CodingSessionUpdate(BaseModel):
    programming_language: Optional[ProgrammingLanguage] = None
    status: Optional[SessionStatus] = None
    duration: Optional[int] = None


class CodingSessionResponse(BaseModel):
    session_id: str
    user_id: str
    interview_id: Optional[str] = None
    programming_language: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CodeSnapshotCreate(BaseModel):
    source_code: str = Field(..., min_length=1)


class CodeSnapshotResponse(BaseModel):
    session_id: str
    source_code: str
    snapshot_number: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExecutionLogsSchema(BaseModel):
    stdout: str
    stderr: str
    execution_time: float
    memory_used: float
    runtime_status: str


class CodeQualityMetricsSchema(BaseModel):
    readability_score: float = Field(..., ge=0, le=100)
    naming_score: float = Field(..., ge=0, le=100)
    optimization_score: float = Field(..., ge=0, le=100)
    maintainability_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    evaluator_remarks: str


class SubmissionCreate(BaseModel):
    source_code: str = Field(..., min_length=1)
    language: ProgrammingLanguage


class SubmissionResponse(BaseModel):
    id: str
    session_id: str
    source_code: str
    language: str
    submitted_at: datetime
    execution_status: CompilationStatus
    score: float
    execution_logs: ExecutionLogsSchema
    code_quality_metrics: CodeQualityMetricsSchema

    class Config:
        from_attributes = True


class TestCaseCreate(BaseModel):
    input: str
    expected_output: str
    is_sample: bool = True


class TestCaseUpdate(BaseModel):
    input: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    passed: Optional[bool] = None
    is_sample: Optional[bool] = None


class TestCaseResponse(BaseModel):
    test_case_id: str
    session_id: str
    input: str
    expected_output: str
    actual_output: Optional[str] = None
    passed: Optional[bool] = None
    is_sample: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIQuestionHookCreate(BaseModel):
    question_id: str = Field(..., min_length=1)
    follow_up_question: str
    related_concept: str
    difficulty: str


class AIQuestionHookUpdate(BaseModel):
    follow_up_question: Optional[str] = None
    related_concept: Optional[str] = None
    difficulty: Optional[str] = None


class AIQuestionHookResponse(BaseModel):
    question_id: str
    follow_up_question: str
    related_concept: str
    difficulty: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlgorithmDiscussionCreate(BaseModel):
    explanation: str
    approach: str
    time_complexity: str
    space_complexity: str
    optimization_notes: str


class AlgorithmDiscussionUpdate(BaseModel):
    explanation: Optional[str] = None
    approach: Optional[str] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    optimization_notes: Optional[str] = None


class AlgorithmDiscussionResponse(BaseModel):
    session_id: str
    explanation: str
    approach: str
    time_complexity: str
    space_complexity: str
    optimization_notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
