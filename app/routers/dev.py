"""
Dev-only utilities for rehearsing the demo without manually recreating data
every time. Disabled unless ENABLE_DEV_ROUTES=1, so it's never live in a
real deployment by accident.
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Issue, Ticket, AgentLog, IssueCluster, Sensor, SensorReading
from app.auth import hash_password, create_access_token

router = APIRouter(prefix="/dev", tags=["dev"])

ENABLED = os.getenv("ENABLE_DEV_ROUTES", "1") == "1"  # on by default for local/demo use
DEMO_PASSWORD = "demo1234"


@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """Wipes all issues/tickets/logs/clusters/sensors/readings/users and
    reseeds a demo citizen AND a demo staff user (both with known
    passwords), returning ready-to-use access tokens for both so you can
    rehearse the demo flow - including the staff-only /analytics/*
    endpoints - without stale data or a manual login."""
    if not ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    # Issue rows reference issue_clusters and sensors via FKs, and
    # SensorReading references sensors, so those must go before Sensor.
    db.query(AgentLog).delete()
    db.query(Ticket).delete()
    db.query(Issue).delete()
    db.query(IssueCluster).delete()
    db.query(SensorReading).delete()
    db.query(Sensor).delete()
    db.query(User).delete()
    db.commit()

    demo_user = User(
        name="Demo Citizen", email="demo@civicrelay.io",
        password_hash=hash_password(DEMO_PASSWORD), role="citizen",
    )
    demo_staff = User(
        name="Demo Staff", email="staff@civicrelay.io",
        password_hash=hash_password(DEMO_PASSWORD), role="staff",
    )
    db.add(demo_user)
    db.add(demo_staff)
    db.commit()
    db.refresh(demo_user)
    db.refresh(demo_staff)

    return {
        "status": "reset",
        "demo_user_id": demo_user.id,
        "demo_user_email": demo_user.email,
        "demo_password": DEMO_PASSWORD,
        "access_token": create_access_token(user_id=demo_user.id),
        "demo_staff_email": demo_staff.email,
        "staff_access_token": create_access_token(user_id=demo_staff.id),
    }
