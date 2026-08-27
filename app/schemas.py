from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    staff_code: Optional[str] = None  # matches STAFF_SIGNUP_CODE env var -> role becomes "staff"


class UserLogin(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class IssueClusterOut(BaseModel):
    category: str
    center_lat: float
    center_lng: float
    report_count: int
    severity: str
    first_reported: datetime
    latest_reported: datetime
    issue_ids: list[str]


class IssueCreate(BaseModel):
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    language: Optional[str] = None  # set automatically if description came from POST /uploads/audio
    urgency_hint: Optional[str] = None  # user-selected Normal/High/Emergency, agent can override


class AgentLogOut(BaseModel):
    agent_name: str
    action: str
    timestamp: datetime

    class Config:
        from_attributes = True


class TicketOut(BaseModel):
    id: str
    authority: Optional[str]
    complaint_text: Optional[str]
    external_ticket_id: Optional[str]
    status: str
    submitted_at: datetime
    sla_deadline: Optional[datetime]

    class Config:
        from_attributes = True


class IssueOut(BaseModel):
    id: str
    description: str
    category: Optional[str]
    severity: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    image_url: Optional[str]
    language: Optional[str]
    created_at: datetime
    ticket: Optional[TicketOut] = None
    logs: list[AgentLogOut] = []

    class Config:
        from_attributes = True


# --- Municipal analytics (staff-only) ---

class AnalyticsOverviewOut(BaseModel):
    total_issues: int
    open_issues: int
    resolved_issues: int
    escalated_issues: int
    avg_resolution_hours: Optional[float]
    sla_compliance_rate: Optional[float]  # % of resolved tickets resolved before their SLA deadline
    by_category: dict[str, int]
    by_severity: dict[str, int]
    by_source: dict[str, int]  # "citizen_report" vs "iot_sensor"


class AnalyticsTrendPointOut(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


class AnalyticsAuthorityOut(BaseModel):
    authority: str
    total: int
    open: int
    resolved: int
    avg_resolution_hours: Optional[float]


class AnalyticsMapPointOut(BaseModel):
    id: str
    category: Optional[str]
    severity: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: Optional[str]
    source: str
    created_at: datetime


class PredictiveSensorAlertOut(BaseModel):
    sensor_id: str
    sensor_type: str
    category: str
    current_value: float
    trend_direction: str
    projected_days_to_threshold: float
    readings_analyzed: int
    latitude: Optional[float]
    longitude: Optional[float]


class RecurrenceRiskOut(BaseModel):
    category: str
    latitude: float
    longitude: float
    occurrence_count: int
    most_recent: datetime
    risk_note: str
