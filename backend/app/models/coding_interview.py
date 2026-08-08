from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SessionStatus(str, Enum):
    PENDING = "Pending"
    ACTIVE = "Active"
    COMPLETED = "Completed"


class CompilationStatus(str, Enum):
    SUCCESS = "Success"
    COMPILATION_ERROR = "Compilation Error"
    RUNTIME_ERROR = "Runtime Error"
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"
    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"


class CodingSessionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    user_id: str
    interview_id: Optional[str] = None
    programming_language: str
    status: SessionStatus = SessionStatus.PENDING
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: int = 0  # In seconds
    created_at: datetime
    updated_at: datetime


class CodeSnapshotDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    source_code: str
    snapshot_number: int
    created_at: datetime


class ExecutionLogs(BaseModel):
    stdout: str
    stderr: str
    execution_time: float  # In seconds
    memory_used: float  # In MB
    runtime_status: str


class CodeQualityMetrics(BaseModel):
    readability_score: float
    naming_score: float
    optimization_score: float
    maintainability_score: float
    overall_score: float
    evaluator_remarks: str


class SubmissionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    source_code: str
    language: str
    submitted_at: datetime
    execution_status: CompilationStatus
    score: float
    execution_logs: ExecutionLogs
    code_quality_metrics: CodeQualityMetrics


class TestCaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    test_case_id: str
    session_id: str
    input: str
    expected_output: str
    actual_output: Optional[str] = None
    passed: Optional[bool] = None
    is_sample: bool = True
    created_at: datetime
    updated_at: datetime


class AIQuestionHookDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    question_id: str
    follow_up_question: str
    related_concept: str
    difficulty: str
    created_at: datetime
    updated_at: datetime


class AlgorithmDiscussionDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    session_id: str
    explanation: str
    approach: str
    time_complexity: str
    space_complexity: str
    optimization_notes: str
    created_at: datetime
    updated_at: datetime
