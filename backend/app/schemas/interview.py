from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

ExperienceLevel = Literal["Fresher", "Junior (1-3 years)", "Mid (3-5 years)", "Senior (5+ years)"]
InterviewType = Literal["Behavioral", "Technical DSA", "System Design"]

class InterviewStartRequest(BaseModel):
    company: str = Field(min_length=2, max_length=100)
    job_role: str = Field(min_length=2, max_length=100)
    experience_level: ExperienceLevel
    interview_type: InterviewType
    question_count: int = Field(default=4, ge=2, le=6)
    @field_validator("company", "job_role")
    @classmethod
    def clean_text(cls, value: str) -> str:
        value = value.strip()
        if not value: raise ValueError("This field must not be blank")
        return value

class InterviewQuestion(BaseModel):
    id: str
    text: str

class SessionResponse(BaseModel):
    id: str
    company: str
    job_role: str
    experience_level: ExperienceLevel
    interview_type: InterviewType
    status: Literal["in_progress", "completed"]
    question_count: int
    answered_count: int
    current_question: Optional[InterviewQuestion] = None
    created_at: datetime

class AnswerRequest(BaseModel):
    question_id: str
    answer: str = Field(min_length=20, max_length=10000)
    @field_validator("answer")
    @classmethod
    def clean_answer(cls, value: str) -> str:
        value = value.strip()
        if not value: raise ValueError("Answer must not be blank")
        return value

class LiveEvaluation(BaseModel):
    score: int = Field(ge=0, le=100)
    strengths: List[str]
    improvements: List[str]

class QuestionFeedback(LiveEvaluation):
    question_id: str
    question: str

class ImprovementPlanItem(BaseModel):
    priority: Literal["high", "medium", "low"]
    focus: str
    action: str

class FinalReport(BaseModel):
    session_id: str
    overall_score: int = Field(ge=0, le=100)
    communication_score: int = Field(ge=0, le=100)
    technical_score: int = Field(ge=0, le=100)
    structure_score: int = Field(ge=0, le=100)
    summary: str
    question_feedback: List[QuestionFeedback]
    improvement_plan: List[ImprovementPlanItem]
    completed_at: datetime

class AnswerResponse(BaseModel):
    session: SessionResponse
    live_evaluation: LiveEvaluation
    final_report: Optional[FinalReport] = None