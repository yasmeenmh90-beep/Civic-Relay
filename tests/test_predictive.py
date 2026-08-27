from datetime import datetime, timedelta

from tests.conftest import TestSessionLocal
from app.models import Sensor, SensorReading
from app.agents import predictive_agent


def _make_sensor_with_readings(sensor_type: str, values_with_days_ago: list[tuple[float, float]]) -> tuple[object, object]:
    """values_with_days_ago: list of (value, days_ago) tuples, e.g. (1.0, 10) = reading of 1.0 taken 10 days ago."""
    db = TestSessionLocal()
    sensor = Sensor(sensor_id=f"TEST-{sensor_type}-{id(values_with_days_ago)}", sensor_type=sensor_type)
    db.add(sensor)
    db.commit()
    db.refresh(sensor)

    for value, days_ago in values_with_days_ago:
        reading = SensorReading(
            sensor_id=sensor.id, value=value,
            recorded_at=datetime.utcnow() - timedelta(days=days_ago),
        )
        db.add(reading)
    db.commit()
    return db, sensor


# --- Trend extrapolation ---

def test_insufficient_readings_yields_no_prediction():
    db, sensor = _make_sensor_with_readings("pothole_depth_cm", [(1.0, 3), (1.2, 2), (1.4, 1)])  # only 3 readings
    result = predictive_agent.predict_sensor_trend(db, sensor)
    assert result is None
    db.close()


def test_stable_readings_yield_no_prediction():
    """A sensor holding steady (no trend toward failure) should not alert."""
    db, sensor = _make_sensor_with_readings("water_pipe_pressure_psi", [
        (28.0, 10), (28.1, 8), (27.9, 6), (28.0, 4), (28.2, 2), (28.0, 0),
    ])
    result = predictive_agent.predict_sensor_trend(db, sensor)
    assert result is None
    db.close()


def test_degrading_pothole_depth_produces_a_prediction():
    """A clearly worsening trend (shallow -> deepening pothole, still below
    the 5cm issue threshold) should predict a future breach."""
    db, sensor = _make_sensor_with_readings("pothole_depth_cm", [
        (1.0, 10), (1.6, 8), (2.2, 6), (2.8, 4), (3.4, 2), (4.0, 0),
    ])
    result = predictive_agent.predict_sensor_trend(db, sensor)
    assert result is not None
    assert result["category"] == "road_infrastructure"
    assert result["trend_direction"] == "increasing"
    assert result["projected_days_to_threshold"] > 0
    assert result["readings_analyzed"] == 6
    db.close()


def test_already_breached_sensor_is_not_a_prediction():
    """A sensor that's already past its threshold is an active issue
    (handled by evaluate_telemetry), not something to predict."""
    db, sensor = _make_sensor_with_readings("pothole_depth_cm", [
        (3.0, 10), (5.0, 8), (7.0, 6), (9.0, 4), (11.0, 2), (14.0, 0),
    ])
    result = predictive_agent.predict_sensor_trend(db, sensor)
    assert result is None  # already breached, not a future prediction
    db.close()


def test_improving_trend_yields_no_prediction():
    """Water pressure trending back UP (recovering) should not alert, even
    though it started below the threshold - it's moving the right direction."""
    db, sensor = _make_sensor_with_readings("water_pipe_pressure_psi", [
        (15.0, 10), (16.5, 8), (18.0, 6), (19.5, 4), (21.0, 2), (22.0, 0),
    ])
    result = predictive_agent.predict_sensor_trend(db, sensor)
    assert result is None
    db.close()


def test_slow_trend_outside_horizon_yields_no_prediction():
    """A trend that will eventually cross the threshold, but not within the
    requested horizon, should not alert - only near-term risk matters."""
    db, sensor = _make_sensor_with_readings("waste_bin_fill_percent", [
        (10.0, 100), (10.5, 80), (11.0, 60), (11.5, 40), (12.0, 20), (12.2, 0),
    ])
    result = predictive_agent.predict_sensor_trend(db, sensor, horizon_days=14.0)
    assert result is None  # at this rate, 90% is many months away
    db.close()


def test_readings_clustered_in_time_yield_no_prediction():
    """Readings all taken within the same hour (e.g. a demo script firing
    quickly) don't have enough real time spread for a meaningful projection."""
    db = TestSessionLocal()
    sensor = Sensor(sensor_id="TEST-CLUSTERED", sensor_type="pothole_depth_cm")
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    now = datetime.utcnow()
    for i, value in enumerate([1.0, 1.5, 2.0, 2.5, 3.0, 3.5]):
        db.add(SensorReading(sensor_id=sensor.id, value=value, recorded_at=now - timedelta(seconds=i * 10)))
    db.commit()

    result = predictive_agent.predict_sensor_trend(db, sensor)
    assert result is None
    db.close()


def test_predict_all_sensor_trends_sorts_by_urgency():
    db = TestSessionLocal()
    urgent = Sensor(sensor_id="TEST-URGENT", sensor_type="pothole_depth_cm")
    calm = Sensor(sensor_id="TEST-CALM", sensor_type="pothole_depth_cm")
    db.add_all([urgent, calm])
    db.commit()
    db.refresh(urgent)
    db.refresh(calm)

    # urgent: fast approach to threshold
    for value, days_ago in [(2.0, 10), (2.8, 8), (3.6, 6), (4.0, 4), (4.4, 2), (4.7, 0)]:
        db.add(SensorReading(sensor_id=urgent.id, value=value, recorded_at=datetime.utcnow() - timedelta(days=days_ago)))
    # calm: slow approach, still within the 90-day horizon but far less urgent
    for value, days_ago in [(1.0, 10), (1.12, 8), (1.23, 6), (1.34, 4), (1.46, 2), (1.57, 0)]:
        db.add(SensorReading(sensor_id=calm.id, value=value, recorded_at=datetime.utcnow() - timedelta(days=days_ago)))
    db.commit()

    results = predictive_agent.predict_all_sensor_trends(db, horizon_days=90)
    ids = [r["sensor_id"] for r in results]
    assert "TEST-URGENT" in ids and "TEST-CALM" in ids
    assert ids.index("TEST-URGENT") < ids.index("TEST-CALM")  # urgent sorted first
    db.close()


# --- Recurrence risk (through the real API) ---

def test_recurrence_risk_detected_when_issue_reopens_after_resolution(client, auth_headers, monkeypatch):
    import app.routers.users as users_router
    monkeypatch.setattr(users_router, "STAFF_SIGNUP_CODE", "recur-code")

    r1 = client.post("/issues", json={
        "description": "Pothole on Elm Street.", "latitude": 40.0, "longitude": 40.0
    }, headers=auth_headers)
    ticket_id = r1.json()["ticket"]["id"]
    client.post(f"/tickets/{ticket_id}/resolve", headers=auth_headers)

    # A second report at the same spot AFTER resolution = recurrence
    client.post("/issues", json={
        "description": "Pothole back again on Elm Street.", "latitude": 40.0001, "longitude": 40.0001
    }, headers=auth_headers)

    client.post("/users", json={"name": "S2", "email": "s2@civicrelay.io", "password": "pass1234", "staff_code": "recur-code"})
    login = client.post("/users/login", json={"email": "s2@civicrelay.io", "password": "pass1234"})
    staff_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    resp = client.get("/analytics/predictions/recurrence", headers=staff_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["category"] == "road_infrastructure"
    assert body[0]["occurrence_count"] == 2


def test_no_recurrence_risk_when_issue_still_open(client, auth_headers, monkeypatch):
    """Two reports at the same spot, neither resolved yet - not a
    'recurrence' (nothing was fixed and broke again), just an unresolved cluster."""
    import app.routers.users as users_router
    monkeypatch.setattr(users_router, "STAFF_SIGNUP_CODE", "code-open")

    client.post("/issues", json={
        "description": "Pothole on Oak Street.", "latitude": 50.0, "longitude": 50.0
    }, headers=auth_headers)
    client.post("/issues", json={
        "description": "Same pothole on Oak Street.", "latitude": 50.0001, "longitude": 50.0001
    }, headers=auth_headers)

    client.post("/users", json={"name": "S3", "email": "s3@civicrelay.io", "password": "pass1234", "staff_code": "code-open"})
    login = client.post("/users/login", json={"email": "s3@civicrelay.io", "password": "pass1234"})
    staff_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    resp = client.get("/analytics/predictions/recurrence", headers=staff_headers)
    assert resp.json() == []


def test_predictions_are_staff_only(client, auth_headers):
    resp = client.get("/analytics/predictions/sensors", headers=auth_headers)
    assert resp.status_code == 403
    resp2 = client.get("/analytics/predictions/recurrence", headers=auth_headers)
    assert resp2.status_code == 403
