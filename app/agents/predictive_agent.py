"""
Predictive maintenance: flags infrastructure likely to fail before a
threshold breach or a citizen report, using two genuine, honest methods -
neither is a trained ML model, and this module doesn't pretend otherwise:

1. Trend extrapolation - ordinary least-squares linear regression on a
   sensor's stored reading history (SensorReading rows), projecting when
   the trend line will cross that sensor type's failure threshold. This is
   real statistics on real stored data, not a neural network - worth
   stating plainly rather than letting "predictive" imply more
   sophistication than is actually here.

2. Recurrence risk - looks at persisted issue clusters (see clustering.py)
   for cases that were marked resolved and then recurred at the same
   location afterward, which is a real signal that the underlying
   infrastructure (not just the symptom) needs attention.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models import Sensor, SensorReading, Issue, IssueCluster, Ticket, TicketStatus
from app.agents.sensor_agent import SENSOR_TYPE_THRESHOLDS, SENSOR_TYPE_CATEGORY

MIN_READINGS_FOR_TREND = 5  # below this, a "trend" is statistical noise, not a signal


def _linear_regression(x_values: list[float], y_values: list[float]) -> tuple[float, float]:
    """Ordinary least squares. Returns (slope, intercept). Pure Python, no
    numpy - this is a handful of sensor readings, not a dataset that needs it."""
    n = len(x_values)
    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_x2 = sum(x * x for x in x_values)

    denominator = n * sum_x2 - sum_x ** 2
    if denominator == 0:
        return 0.0, sum_y / n  # all readings at the same timestamp - no meaningful trend

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept


def predict_sensor_trend(db: Session, sensor: Sensor, horizon_days: float = 14.0) -> dict | None:
    """
    Returns a predictive alert dict if this sensor's reading history shows
    a trend projected to cross its failure threshold within `horizon_days`,
    or None if: there's not enough history, the trend isn't moving toward
    failure, or the sensor has already breached (that's an active issue via
    evaluate_telemetry, not a *prediction* - this function is specifically
    for catching it BEFORE that happens).
    """
    threshold_info = SENSOR_TYPE_THRESHOLDS.get(sensor.sensor_type)
    if not threshold_info:
        return None

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.sensor_id == sensor.id)
        .order_by(SensorReading.recorded_at)
        .all()
    )
    if len(readings) < MIN_READINGS_FOR_TREND:
        return None  # not enough history for a statistically meaningful trend

    first_time = readings[0].recorded_at
    x_values = [(r.recorded_at - first_time).total_seconds() / 86400 for r in readings]  # days since first reading
    y_values = [r.value for r in readings]

    # All readings clustered at effectively the same instant (e.g. a demo
    # script firing readings seconds apart) - not enough real time elapsed
    # to extrapolate a meaningful days-to-threshold estimate.
    if x_values[-1] - x_values[0] < (1 / 24):  # less than 1 hour of real spread
        return None

    slope, intercept = _linear_regression(x_values, y_values)

    direction = threshold_info["direction"]
    threshold = threshold_info["threshold"]
    latest_value = y_values[-1]

    # Already past the threshold - that's a live issue (evaluate_telemetry
    # handles it), not something to *predict*.
    if direction == "increasing" and latest_value >= threshold:
        return None
    if direction == "decreasing" and latest_value <= threshold:
        return None

    # Trend isn't moving toward failure at all - improving or flat.
    if direction == "increasing" and slope <= 0:
        return None
    if direction == "decreasing" and slope >= 0:
        return None

    # Solve for the x (days since first reading) where the trend line
    # crosses the threshold, then convert to "days from now."
    x_at_threshold = (threshold - intercept) / slope
    days_remaining = x_at_threshold - x_values[-1]

    if days_remaining < 0 or days_remaining > horizon_days:
        return None  # already covered above / outside our prediction window

    return {
        "sensor_id": sensor.sensor_id,
        "sensor_type": sensor.sensor_type,
        "category": SENSOR_TYPE_CATEGORY.get(sensor.sensor_type, "other"),
        "current_value": round(latest_value, 2),
        "trend_direction": direction,
        "projected_days_to_threshold": round(days_remaining, 1),
        "readings_analyzed": len(readings),
        "latitude": sensor.latitude,
        "longitude": sensor.longitude,
    }


def predict_all_sensor_trends(db: Session, horizon_days: float = 14.0) -> list[dict]:
    sensors = db.query(Sensor).all()
    alerts = []
    for sensor in sensors:
        alert = predict_sensor_trend(db, sensor, horizon_days=horizon_days)
        if alert:
            alerts.append(alert)
    return sorted(alerts, key=lambda a: a["projected_days_to_threshold"])


def get_recurrence_risks(db: Session, lookback_days: int = 180) -> list[dict]:
    """
    Flags locations where an issue was marked resolved and then a NEW issue
    in the same persisted cluster (same category, same spot) appeared
    afterward - a real signal that a temporary fix didn't hold, or that the
    underlying infrastructure is prone to repeat failure and needs
    permanent attention rather than another one-off repair.
    """
    since = datetime.utcnow() - timedelta(days=lookback_days)
    clusters = db.query(IssueCluster).filter(IssueCluster.report_count >= 2).all()

    results = []
    for cluster in clusters:
        issues = (
            db.query(Issue)
            .filter(Issue.cluster_id == cluster.id, Issue.created_at >= since)
            .order_by(Issue.created_at)
            .all()
        )

        recurred = False
        for i in range(len(issues) - 1):
            ticket = issues[i].ticket
            next_issue = issues[i + 1]
            if ticket and ticket.status == TicketStatus.RESOLVED and ticket.resolved_at:
                if next_issue.created_at > ticket.resolved_at:
                    recurred = True
                    break

        if recurred:
            results.append({
                "category": cluster.category,
                "latitude": cluster.center_lat,
                "longitude": cluster.center_lng,
                "occurrence_count": cluster.report_count,
                "most_recent": cluster.latest_reported,
                "risk_note": (
                    f"This {cluster.category.replace('_', ' ')} issue has recurred after "
                    f"being marked resolved - infrastructure may need permanent repair "
                    f"rather than another temporary fix."
                ),
            })

    return sorted(results, key=lambda r: r["occurrence_count"], reverse=True)
