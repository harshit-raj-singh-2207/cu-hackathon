from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.database import get_database
from app.schemas.interview import AnswerRequest, AnswerResponse, FinalReport, InterviewQuestion, InterviewStartRequest, LiveEvaluation, SessionResponse

router = APIRouter()
QUESTION_TEMPLATES = {
    "Behavioral": ["Tell me about a difficult challenge you faced as a {role} and how you resolved it.", "Describe a time you disagreed with a stakeholder. What did you do?", "Tell me about a project that did not meet expectations and what you learned.", "Describe a time you used data to influence a decision."],
    "Technical DSA": ["How would you find duplicate values in a large data set? State time and space complexity.", "Design an LRU cache and explain its complexity.", "How would you find the shortest path in an unweighted graph?", "Explain how you would detect a cycle in a linked list."],
    "System Design": ["Design a scalable service for a {company}-style product. State the main components.", "How would you make the design reliable under high traffic?", "What would you cache, and what trade-offs would that introduce?", "How would you observe and safely evolve this system?"],
}

def _oid(value):
    if not ObjectId.is_valid(value): raise HTTPException(status_code=404, detail="Interview session not found")
    return ObjectId(value)

def _current(session):
    done = {item["question_id"] for item in session["answers"]}
    return next((InterviewQuestion(**item) for item in session["questions"] if item["id"] not in done), None)

def _session(session):
    return SessionResponse(id=str(session["_id"]), company=session["company"], job_role=session["job_role"], experience_level=session["experience_level"], interview_type=session["interview_type"], status=session["status"], question_count=len(session["questions"]), answered_count=len(session["answers"]), current_question=_current(session), created_at=session["created_at"])

def _evaluate(answer, interview_type):
    words, text = answer.split(), answer.lower()
    score = min(70, 35 + len(words) // 3) + (10 if any(c.isdigit() for c in answer) else 0)
    signals = {"Behavioral": ("situation", "action", "result"), "Technical DSA": ("complexity", "time", "space"), "System Design": ("scale", "database", "cache")}[interview_type]
    structured = all(signal in text for signal in signals)
    if structured: score += 15
    score = min(score, 100)
    strengths = (["You used role-relevant structure."] if structured else []) + (["You supported your answer with a measurable detail."] if any(c.isdigit() for c in answer) else [])
    if not strengths: strengths = ["You gave a direct response to the question."]
    improvements = []
    if len(words) < 45: improvements.append("Add context, your decisions, and the final impact.")
    if not any(c.isdigit() for c in answer): improvements.append("Add a concrete metric or observable result.")
    if not structured: improvements.append("State your reasoning in a clearer step-by-step structure.")
    return LiveEvaluation(score=score, strengths=strengths, improvements=improvements or ["Keep using this concise, evidence-based structure."])

def _report(session):
    feedback = []
    for item in session["answers"]:
        evaluation = _evaluate(item["answer"], session["interview_type"])
        feedback.append({"question_id": item["question_id"], "question": item["question"], **evaluation.model_dump()})
    overall = round(sum(item["score"] for item in feedback) / len(feedback))
    plan = [
        {"priority": "high", "focus": "Answer structure", "action": "Practice two answers using a clear context, action, and result sequence."},
        {"priority": "medium", "focus": "Evidence", "action": "Add one metric, constraint, or measurable outcome to every answer."},
        {"priority": "low", "focus": "Role preparation", "action": f"Review {session['company']} interview expectations for {session['job_role']}."},
    ]
    return {"session_id": str(session["_id"]), "overall_score": overall, "communication_score": max(0, overall - 3), "technical_score": overall if session["interview_type"] != "Behavioral" else max(0, overall - 7), "structure_score": overall if session["interview_type"] == "Behavioral" else max(0, overall - 4), "summary": "Your personalized report is based on answer length, structure, measurable evidence, and interview-type signals.", "question_feedback": feedback, "improvement_plan": plan, "completed_at": datetime.now(timezone.utc)}

async def _owned(session_id, user_id):
    db = get_database()
    if db is None: raise HTTPException(status_code=500, detail="Database connection is unavailable")
    session = await db["interview_sessions"].find_one({"_id": _oid(session_id), "user_id": user_id})
    if not session: raise HTTPException(status_code=404, detail="Interview session not found")
    return session

@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(payload: InterviewStartRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None: raise HTTPException(status_code=500, detail="Database connection is unavailable")
    now = datetime.now(timezone.utc)
    prompts = QUESTION_TEMPLATES[payload.interview_type][:payload.question_count]
    session = {"user_id": current_user["id"], **payload.model_dump(exclude={"question_count"}), "questions": [{"id": str(i + 1), "text": text.format(role=payload.job_role, company=payload.company)} for i, text in enumerate(prompts)], "answers": [], "status": "in_progress", "created_at": now, "report": None}
    result = await db["interview_sessions"].insert_one(session)
    session["_id"] = result.inserted_id
    return _session(session)

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_interview(session_id: str, current_user: dict = Depends(get_current_user)):
    return _session(await _owned(session_id, current_user["id"]))

@router.post("/sessions/{session_id}/answers", response_model=AnswerResponse)
async def submit_answer(session_id: str, payload: AnswerRequest, current_user: dict = Depends(get_current_user)):
    session = await _owned(session_id, current_user["id"])
    if session["status"] == "completed": raise HTTPException(status_code=409, detail="This interview is already completed")
    question = _current(session)
    if question is None or payload.question_id != question.id: raise HTTPException(status_code=409, detail="Submit an answer for the current question")
    evaluation = _evaluate(payload.answer, session["interview_type"])
    session["answers"].append({"question_id": question.id, "question": question.text, "answer": payload.answer, "submitted_at": datetime.now(timezone.utc)})
    report = None
    if len(session["answers"]) == len(session["questions"]):
        session["status"] = "completed"
        session["report"] = _report(session)
        report = FinalReport(**session["report"])
    db = get_database()
    await db["interview_sessions"].replace_one({"_id": session["_id"]}, session)
    return AnswerResponse(session=_session(session), live_evaluation=evaluation, final_report=report)

@router.get("/sessions/{session_id}/report", response_model=FinalReport)
async def get_report(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await _owned(session_id, current_user["id"])
    if session["status"] != "completed": raise HTTPException(status_code=409, detail="Complete every question before requesting the report")
    return FinalReport(**session["report"])