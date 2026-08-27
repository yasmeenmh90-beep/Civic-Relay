"""
IoT sensor ingestion: the real backend half of an AWS IoT Core pipeline
(device -> MQTT publish -> IoT Core -> IoT Rule -> Lambda/HTTP action ->
this endpoint). No real sensor hardware exists for this project to connect
to - see app/scripts/simulate_iot_sensors.py for the simulator that stands
in for it, generating realistic telemetry payloads in the same shape a real
device would send.

Auth is a shared API key (IOT_INGEST_API_KEY), not a JWT - this is
machine-to-machine traffic from a device fleet or IoT Rule, not a logged-in
citizen, so there's no per-user identity to authenticate.
"""
import os
import hmac
import secrets
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Sensor, SensorReading, Issue, Ticket, TicketStatus, Severity, User
from app.agents.sensor_agent import evaluate_telemetry, SENSOR_TYPE_RULES
from app.agents.orchestrator import run_sensor_pipeline, _log
from app.auth import hash_password

router = APIRouter(prefix="/iot", tags=["iot"])
logger = logging.getLogger("civicrelay.iot")

IOT_INGEST_API_KEY = os.getenv("IOT_INGEST_API_KEY", "")
IOT_SYSTEM_USER_EMAIL = "iot-monitoring@civicrelay.local"


class TelemetryIn(BaseModel):
    sensor_id: str
    sensor_type: str
    value: float
    latitude: float | None = None
    longitude: float | None = None


def _check_api_key(x_iot_api_key: str | None = Header(None)):
    if not IOT_INGEST_API_KEY:
        raise HTTPException(status_code=503, detail="IoT ingestion isn't configured on this deployment (IOT_INGEST_API_KEY not set).")
    if not x_iot_api_key or not hmac.compare_digest(x_iot_api_key, IOT_INGEST_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing X-IoT-Api-Key header.")


def _get_or_create_iot_system_user(db: Session) -> User:
    user = db.query(User).filter(User.email == IOT_SYSTEM_USER_EMAIL).first()
    if user:
        return user
    user = User(
        name="IoT Monitoring System",
        email=IOT_SYSTEM_USER_EMAIL,
        password_hash=hash_password(secrets.token_urlsafe(32)),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _get_or_register_sensor(db: Session, telemetry: TelemetryIn) -> Sensor:
    sensor = db.query(Sensor).filter(Sensor.sensor_id == telemetry.sensor_id).first()
    if sensor:
        sensor.last_seen_at = datetime.utcnow()
        if telemetry.latitude is not None:
            sensor.latitude = telemetry.latitude
        if telemetry.longitude is not None:
            sensor.longitude = telemetry.longitude
        db.commit()
        return sensor

    sensor = Sensor(
        sensor_id=telemetry.sensor_id,
        sensor_type=telemetry.sensor_type,
        latitude=telemetry.latitude,
        longitude=telemetry.longitude,
        last_seen_at=datetime.utcnow(),
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.post("/telemetry", dependencies=[Depends(_check_api_key)])
def receive_telemetry(telemetry: TelemetryIn, db: Session = Depends(get_db)):
    if telemetry.sensor_type not in SENSOR_TYPE_RULES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown sensor_type '{telemetry.sensor_type}'. Known types: {list(SENSOR_TYPE_RULES.keys())}",
        )

    sensor = _get_or_register_sensor(db, telemetry)

    # Persist every reading as history - not just the latest - so
    # predictive_agent.py can extrapolate a trend later. Recorded
    # regardless of whether this particular value crosses a threshold;
    # the normal readings are exactly what a trend is built from.
    db.add(SensorReading(sensor_id=sensor.id, value=telemetry.value))
    db.commit()

    evaluation = evaluate_telemetry(telemetry.sensor_type, telemetry.value)

    if evaluation is None:
        return {"status": "normal", "sensor_id": sensor.sensor_id, "value": telemetry.value}

    # Dedup: if this sensor already has an OPEN issue, don't spam-create a
    # new one every time it reports the same ongoing problem - just log
    # that it's still detected and return the existing case.
    existing_open_issue = (
        db.query(Issue)
        .join(Ticket, Ticket.issue_id == Issue.id)
        .filter(Issue.sensor_id == sensor.id, Ticket.status != TicketStatus.RESOLVED)
        .first()
    )
    if existing_open_issue:
        _log(db, existing_open_issue.id, "Tracking Agent",
             f"Sensor {sensor.sensor_id} still detecting this issue (value: {telemetry.value}). No new report created.")
        return {"status": "existing_issue_updated", "issue_id": existing_open_issue.id}

    system_user = _get_or_create_iot_system_user(db)
    issue = Issue(
        user_id=system_user.id,
        description=evaluation.description,
        category=evaluation.category,
        severity=Severity(evaluation.severity),
        latitude=sensor.latitude,
        longitude=sensor.longitude,
        source="iot_sensor",
        sensor_id=sensor.id,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    run_sensor_pipeline(db, issue)
    db.refresh(issue)

    logger.info("IoT: auto-created issue %s from sensor %s (%s=%s)",
                issue.id, sensor.sensor_id, telemetry.sensor_type, telemetry.value)

    return {"status": "issue_created", "issue_id": issue.id, "category": issue.category, "severity": issue.severity}
