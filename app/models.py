import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship

from app.db import Base


def gen_id():
    return str(uuid.uuid4())


class Severity(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    EMERGENCY = "emergency"


class TicketStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    WAITING_FOR_AUTHORITY = "waiting_for_authority"
    IN_PROGRESS = "in_progress"
    AWAITING_APPROVAL = "awaiting_approval"  # escalation drafted, needs human approval
    ESCALATED = "escalated"                   # escalation approved and sent
    RESOLVED = "resolved"


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=True)  # set for users who report via WhatsApp
    role = Column(String, default="citizen")  # "citizen" or "staff" - staff can see /analytics/*

    issues = relationship("Issue", back_populates="user")


class Issue(Base):
    __tablename__ = "issues"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=True)          # set by Triage Agent
    severity = Column(Enum(Severity, native_enum=False, length=20), nullable=True)   # set by Triage Agent
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)
    language = Column(String, nullable=True)  # BCP-47 code (e.g. "es-US") if reported via voice, or client-supplied
    cluster_id = Column(String, ForeignKey("issue_clusters.id"), nullable=True)
    source = Column(String, default="citizen_report")  # "citizen_report" or "iot_sensor"
    sensor_id = Column(String, ForeignKey("sensors.id"), nullable=True)  # set when source == "iot_sensor"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="issues")
    ticket = relationship("Ticket", back_populates="issue", uselist=False)
    logs = relationship("AgentLog", back_populates="issue", order_by="AgentLog.timestamp")
    cluster = relationship("IssueCluster", back_populates="issues")
    sensor = relationship("Sensor", back_populates="issues")


class Sensor(Base):
    """
    A registered IoT device. Auto-created on first telemetry received at
    POST /iot/telemetry - see app/agents/sensor_agent.py for the real
    ingestion pipeline and app/scripts/simulate_iot_sensors.py for the
    simulator standing in for real hardware (no real civic-infrastructure
    sensor network exists for this project to connect to).
    """
    __tablename__ = "sensors"
    id = Column(String, primary_key=True, default=gen_id)
    sensor_id = Column(String, unique=True, nullable=False)  # device-assigned id, e.g. "SENSOR-ROAD-0042"
    sensor_type = Column(String, nullable=False)  # see SENSOR_TYPE_RULES in sensor_agent.py
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, nullable=True)

    issues = relationship("Issue", back_populates="sensor")
    readings = relationship("SensorReading", back_populates="sensor", order_by="SensorReading.recorded_at")


class SensorReading(Base):
    """
    Every telemetry value a sensor has ever reported - not just the latest
    (Sensor.last_seen_at only tracks recency, not history). Needed for
    trend-based predictive maintenance (app/agents/predictive_agent.py) -
    you can't extrapolate a trend from a single data point.
    """
    __tablename__ = "sensor_readings"
    id = Column(String, primary_key=True, default=gen_id)
    sensor_id = Column(String, ForeignKey("sensors.id"), nullable=False)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    sensor = relationship("Sensor", back_populates="readings")


class IssueCluster(Base):
    """
    A persisted community-issue cluster (e.g. 3 pothole reports on the same
    street). Updated incrementally as each new issue is reported - see
    app/agents/clustering.py - instead of recomputed from scratch on every
    GET /issues/clusters request.
    """
    __tablename__ = "issue_clusters"
    id = Column(String, primary_key=True, default=gen_id)
    category = Column(String, nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    report_count = Column(Integer, default=1)
    severity = Column(String, nullable=False)   # highest severity among member issues
    first_reported = Column(DateTime, nullable=False)
    latest_reported = Column(DateTime, nullable=False)

    issues = relationship("Issue", back_populates="cluster")


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(String, primary_key=True, default=gen_id)
    issue_id = Column(String, ForeignKey("issues.id"), unique=True, nullable=False)
    authority = Column(String, nullable=True)           # set by Research Agent
    complaint_text = Column(Text, nullable=True)         # set by Action Agent
    external_ticket_id = Column(String, nullable=True)   # e.g. CIV-2026-1048
    status = Column(Enum(TicketStatus, native_enum=False, length=30), default=TicketStatus.SUBMITTED)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    sla_deadline = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)  # set when status -> RESOLVED, needed for resolution-time analytics

    issue = relationship("Issue", back_populates="ticket")


class AgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(String, primary_key=True, default=gen_id)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    agent_name = Column(String, nullable=False)
    action = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="logs")
