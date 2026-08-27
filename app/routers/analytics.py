from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import (
    AnalyticsOverviewOut, AnalyticsTrendPointOut, AnalyticsAuthorityOut, AnalyticsMapPointOut,
    PredictiveSensorAlertOut, RecurrenceRiskOut,
)
from app.agents import analytics, predictive_agent
from app.deps import get_current_staff_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverviewOut)
def overview(db: Session = Depends(get_db), staff: User = Depends(get_current_staff_user)):
    """City-wide totals: open/resolved/escalated counts, average resolution
    time, SLA compliance rate, and breakdowns by category/severity/source."""
    return analytics.get_overview(db)


@router.get("/trends", response_model=list[AnalyticsTrendPointOut])
def trends(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db), staff: User = Depends(get_current_staff_user)):
    """Daily issue-report counts for the last `days` days (default 30)."""
    return analytics.get_trends(db, days=days)


@router.get("/by-authority", response_model=list[AnalyticsAuthorityOut])
def by_authority(db: Session = Depends(get_db), staff: User = Depends(get_current_staff_user)):
    """Per-department breakdown - which authorities have the most open cases
    and the slowest average resolution time."""
    return analytics.get_by_authority(db)


@router.get("/map", response_model=list[AnalyticsMapPointOut])
def map_points(db: Session = Depends(get_db), staff: User = Depends(get_current_staff_user)):
    """Every individual issue with coordinates - the granular staff view,
    unlike the public GET /issues/clusters which only shows grouped clusters."""
    return analytics.get_map_points(db)


@router.get("/predictions/sensors", response_model=list[PredictiveSensorAlertOut])
def sensor_predictions(
    horizon_days: float = Query(14.0, ge=1, le=90),
    db: Session = Depends(get_db),
    staff: User = Depends(get_current_staff_user),
):
    """Sensors whose reading history trend is projected to cross their
    failure threshold within `horizon_days` - real linear regression on
    stored telemetry, not a trained ML model. Requires at least 5 stored
    readings per sensor to produce a result (see predictive_agent.py)."""
    return predictive_agent.predict_all_sensor_trends(db, horizon_days=horizon_days)


@router.get("/predictions/recurrence", response_model=list[RecurrenceRiskOut])
def recurrence_predictions(
    lookback_days: int = Query(180, ge=1, le=730),
    db: Session = Depends(get_db),
    staff: User = Depends(get_current_staff_user),
):
    """Locations where an issue was resolved and then recurred - a real
    signal from historical data that the underlying infrastructure, not
    just the symptom, needs permanent attention."""
    return predictive_agent.get_recurrence_risks(db, lookback_days=lookback_days)
