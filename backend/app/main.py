from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.demo_data import ISSUES, NOTIFICATIONS, VOLUNTEERS, VOLUNTEER_TASKS, build_issue_summary

app = FastAPI(
    title="CivicConnect API",
    version="1.0.0",
    description="AI-powered civic issue reporting and resolution platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IssueCategory = Literal["garbage", "pothole", "water-leakage", "blocked-drainage", "broken-streetlight", "public-property"]
IssueStatus = Literal["Submitted", "Under Review", "Verified", "Assigned", "In Progress", "Resolved", "Closed"]
PriorityLevel = Literal["Critical", "High", "Medium", "Low"]

CATEGORY_IMAGE_FALLBACKS = {
    "garbage": "https://images.pexels.com/photos/11553984/pexels-photo-11553984.jpeg?auto=compress&cs=tinysrgb&w=900",
    "pothole": "https://images.pexels.com/photos/11849379/pexels-photo-11849379.jpeg?auto=compress&cs=tinysrgb&w=900",
    "water-leakage": "https://images.pexels.com/photos/32200999/pexels-photo-32200999.jpeg?auto=compress&cs=tinysrgb&w=900",
    "blocked-drainage": "https://images.pexels.com/photos/38239813/pexels-photo-38239813.jpeg?auto=compress&cs=tinysrgb&w=900",
    "broken-streetlight": "https://images.pexels.com/photos/9953451/pexels-photo-9953451.jpeg?auto=compress&cs=tinysrgb&w=900",
    "public-property": "https://images.pexels.com/photos/7078287/pexels-photo-7078287.jpeg?auto=compress&cs=tinysrgb&w=900",
}


class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "citizen"


class UserLoginRequest(BaseModel):
    email: str
    password: str


class IssueReportRequest(BaseModel):
    title: str = Field(..., min_length=6, max_length=150)
    description: str = Field(..., min_length=15)
    category: IssueCategory
    latitude: float
    longitude: float
    reporter_name: str = "Citizen"
    image_url: str | None = None


class AIClassificationRequest(BaseModel):
    description: str | None = None
    category_hint: str | None = None
    image_url: str | None = None


class StatusUpdateRequest(BaseModel):
    status: IssueStatus
    note: str | None = None


class SupportRequest(BaseModel):
    user_name: str


class IssuePriorityResult(BaseModel):
    priority: PriorityLevel
    reason: str
    score: int


def calculate_priority(issue_data: Dict[str, Any]) -> IssuePriorityResult:
    category_weights = {
        "pothole": 20,
        "water-leakage": 18,
        "broken-streetlight": 14,
        "blocked-drainage": 17,
        "garbage": 12,
        "public-property": 11,
    }
    score = category_weights.get(issue_data.get("category"), 10)
    if issue_data.get("severity") == "Critical":
        score += 30
    elif issue_data.get("severity") == "High":
        score += 20
    elif issue_data.get("severity") == "Medium":
        score += 10

    score += min(int(issue_data.get("supporters", 0) / 5), 14)
    score += 10 if issue_data.get("status") in {"Verified", "Assigned", "In Progress"} else 0

    if issue_data.get("severity") == "Critical" or score >= 65:
        priority = "Critical"
        reason = "High safety risk, multiple community impacts, and strong public urgency."
    elif issue_data.get("severity") == "High" or score >= 45:
        priority = "High"
        reason = "Likely to affect residents or road safety unless addressed soon."
    elif score >= 25:
        priority = "Medium"
        reason = "Moderate impact but needs a timely resolution to prevent escalation."
    else:
        priority = "Low"
        reason = "Low immediate risk; community resolution can be scheduled accordingly."
    return IssuePriorityResult(priority=priority, reason=reason, score=score)


def detect_duplicates(issue: Dict[str, Any], issue_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    matches: List[Dict[str, Any]] = []
    for existing in issue_list:
        if existing["id"] == issue["id"]:
            continue
        category_match = existing["category"] == issue["category"]
        distance = ((existing["latitude"] - issue["latitude"]) ** 2 + (existing["longitude"] - issue["longitude"]) ** 2) ** 0.5
        text_overlap = issue["title"].lower() in existing["title"].lower() or existing["title"].lower() in issue["title"].lower()
        if (category_match and distance < 0.03) or text_overlap:
            matches.append(existing)
    return matches


def classify_issue(payload: Dict[str, Any]) -> Dict[str, Any]:
    description = (payload.get("description") or "").lower()
    category_hint = (payload.get("category_hint") or "").lower()
    issue_map = {
        "garbage": {"title": "Garbage accumulation at public area", "severity": "Medium", "confidence": 0.92},
        "pothole": {"title": "Pothole on road surface", "severity": "High", "confidence": 0.95},
        "water-leakage": {"title": "Water leakage from municipal pipeline", "severity": "High", "confidence": 0.94},
        "blocked-drainage": {"title": "Blocked drainage line", "severity": "High", "confidence": 0.9},
        "broken-streetlight": {"title": "Broken streetlight needs replacement", "severity": "Medium", "confidence": 0.89},
        "public-property": {"title": "Public infrastructure damaged or defaced", "severity": "Medium", "confidence": 0.87},
    }

    detected_category = category_hint if category_hint in issue_map else "garbage"
    if "pothole" in description or "road" in description or "speed breaker" in description:
        detected_category = "pothole"
    elif "water" in description or "pipe" in description or "leak" in description:
        detected_category = "water-leakage"
    elif "drain" in description or "flood" in description or "clog" in description:
        detected_category = "blocked-drainage"
    elif "streetlight" in description or "lamp" in description or "light" in description:
        detected_category = "broken-streetlight"

    match = issue_map[detected_category]
    return {"category": detected_category, "title": match["title"], "severity": match["severity"], "confidence": match["confidence"], "reason": "AI demo model matched the uploaded issue to the most likely civic category."}


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    return {"status": "ok", "service": "CivicConnect API", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/auth/register")
def register_user(payload: UserRegisterRequest):
    if not payload.name or len(payload.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name is required.")
    raise HTTPException(
        status_code=503,
        detail="Registration is unavailable: persistent user storage is not configured. Use the documented demo account.",
    )


@app.post("/api/auth/login")
def login_user(payload: UserLoginRequest):
    email = payload.email.strip().lower()
    password = payload.password.strip()

    if "@" not in email:
        raise HTTPException(status_code=400, detail="Please provide a valid email.")

    if email != "demo@civicconnect.com" or password != "civic123":
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "message": "Login successful",
        "token": "demo-jwt-token-civicconnect",
        "user": {"name": "Demo Citizen", "email": email, "role": "citizen"},
    }


@app.get("/api/issues")
def get_issues() -> List[Dict[str, Any]]:
    return ISSUES


@app.get("/api/issues/map")
def get_map_issues() -> List[Dict[str, Any]]:
    return [build_issue_summary(issue) for issue in ISSUES]


@app.get("/api/issues/{issue_id}")
def get_issue(issue_id: str):
    for issue in ISSUES:
        if issue["id"] == issue_id:
            return issue
    raise HTTPException(status_code=404, detail="Issue not found")


@app.post("/api/ai/classify")
def classify_issue_endpoint(payload: AIClassificationRequest):
    result = classify_issue(payload.model_dump())
    return result


@app.post("/api/issues/report")
def report_issue(payload: IssueReportRequest):
    ai_result = classify_issue({"description": payload.description, "category_hint": payload.category})
    fallback_image = CATEGORY_IMAGE_FALLBACKS.get(ai_result["category"], CATEGORY_IMAGE_FALLBACKS["garbage"])
    new_issue = {
        "id": f"ISS-{1000 + len(ISSUES)}",
        "title": payload.title or ai_result["title"],
        "description": payload.description,
        "category": ai_result["category"],
        "status": "Submitted",
        "priority": "Medium",
        "severity": ai_result["severity"],
        "reporter_name": payload.reporter_name,
        "reporter_role": "Citizen",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "image_url": payload.image_url or fallback_image,
        "supporters": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "timeline": [{"status": "Submitted", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Issue reported through CivicConnect."}],
        "ai_summary": ai_result["reason"],
        "confidence": ai_result["confidence"],
    }
    priority = calculate_priority(new_issue)
    new_issue["priority"] = priority.priority
    duplicate_candidates = detect_duplicates(new_issue, ISSUES)
    ISSUES.insert(0, new_issue)
    return {
        "message": "Issue reported successfully",
        "issue": new_issue,
        "duplicate_candidates": duplicate_candidates,
        "priority": priority.model_dump(),
    }


@app.post("/api/issues/{issue_id}/support")
def support_issue(issue_id: str, payload: SupportRequest):
    for issue in ISSUES:
        if issue["id"] == issue_id:
            issue["supporters"] = issue.get("supporters", 0) + 1
            issue["timeline"].append({"status": "Support Added", "timestamp": datetime.now(timezone.utc).isoformat(), "note": f"{payload.user_name} supported this issue."})
            return {"message": "Support recorded", "issue_id": issue_id, "supporters": issue["supporters"]}
    raise HTTPException(status_code=404, detail="Issue not found")


@app.post("/api/issues/{issue_id}/status")
def update_issue_status(issue_id: str, payload: StatusUpdateRequest):
    for issue in ISSUES:
        if issue["id"] == issue_id:
            issue["status"] = payload.status
            issue["timeline"].append({"status": payload.status, "timestamp": datetime.now(timezone.utc).isoformat(), "note": payload.note or "Status updated by admin."})
            return {"message": "Status updated", "issue": issue}
    raise HTTPException(status_code=404, detail="Issue not found")


@app.get("/api/dashboard/stats")
def dashboard_stats() -> Dict[str, Any]:
    category_counts = {}
    priority_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for issue in ISSUES:
        category_counts[issue["category"]] = category_counts.get(issue["category"], 0) + 1
        priority_counts[issue["priority"]] = priority_counts.get(issue["priority"], 0) + 1

    resolved = sum(1 for issue in ISSUES if issue["status"] in {"Resolved", "Closed"})
    pending = sum(1 for issue in ISSUES if issue["status"] not in {"Resolved", "Closed"})
    return {
        "total_issues": len(ISSUES),
        "pending_issues": pending,
        "resolved_issues": resolved,
        "critical_issues": priority_counts["Critical"],
        "active_volunteers": len(VOLUNTEERS),
        "average_resolution_time": "4.3 days",
        "category_counts": category_counts,
        "priority_counts": priority_counts,
        "notifications": NOTIFICATIONS,
    }


@app.get("/api/volunteers")
def get_volunteers():
    return {"volunteers": VOLUNTEERS, "tasks": VOLUNTEER_TASKS}


@app.get("/api/profile")
def get_profile():
    return {
        "name": "Asha R.",
        "email": "asha@example.com",
        "role": "Citizen",
        "points": 420,
        "badges": ["Report Starter", "Community Voice"],
        "resolved_issues": 8,
    }


@app.post("/api/volunteers/tasks/{task_id}/accept")
def accept_task(task_id: str):
    for task in VOLUNTEER_TASKS:
        if task["task_id"] == task_id:
            task["status"] = "Accepted"
            return {"message": "Volunteer task accepted", "task": task}
    raise HTTPException(status_code=404, detail="Task not found")


@app.get("/")
def root():
    return {"message": "CivicConnect backend is running.", "docs": "/docs"}
