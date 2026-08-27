from app.agents.sensor_agent import evaluate_telemetry


# --- Threshold evaluation logic (pure, no network/DB) ---

def test_shallow_pothole_not_reported():
    assert evaluate_telemetry("pothole_depth_cm", 2.0) is None


def test_deep_pothole_reported_as_high():
    result = evaluate_telemetry("pothole_depth_cm", 12.0)
    assert result.category == "road_infrastructure"
    assert result.severity == "high"


def test_very_deep_pothole_reported_as_emergency():
    result = evaluate_telemetry("pothole_depth_cm", 20.0)
    assert result.severity == "emergency"


def test_streetlight_drawing_power_is_normal():
    assert evaluate_telemetry("streetlight_power_draw_watts", 45.0) is None


def test_streetlight_zero_draw_is_an_issue():
    result = evaluate_telemetry("streetlight_power_draw_watts", 0.0)
    assert result.category == "electrical_infrastructure"
    assert result.severity == "high"


def test_normal_water_pressure_not_reported():
    assert evaluate_telemetry("water_pipe_pressure_psi", 28.0) is None


def test_low_water_pressure_is_high_severity():
    result = evaluate_telemetry("water_pipe_pressure_psi", 12.0)
    assert result.category == "water_authority"
    assert result.severity == "high"


def test_near_zero_water_pressure_is_emergency():
    result = evaluate_telemetry("water_pipe_pressure_psi", 2.0)
    assert result.severity == "emergency"


def test_bin_not_full_not_reported():
    assert evaluate_telemetry("waste_bin_fill_percent", 50.0) is None


def test_full_bin_is_reported():
    result = evaluate_telemetry("waste_bin_fill_percent", 95.0)
    assert result.category == "waste_management"


# --- Ingestion endpoint (through the real FastAPI route) ---

def test_telemetry_requires_api_key(client, monkeypatch):
    import app.routers.iot as iot_router
    monkeypatch.setattr(iot_router, "IOT_INGEST_API_KEY", "the-real-key")

    resp = client.post("/iot/telemetry", json={
        "sensor_id": "SENSOR-1", "sensor_type": "pothole_depth_cm", "value": 12.0,
    })
    assert resp.status_code == 401


def test_telemetry_rejects_wrong_api_key(client, monkeypatch):
    import app.routers.iot as iot_router
    monkeypatch.setattr(iot_router, "IOT_INGEST_API_KEY", "the-real-key")

    resp = client.post(
        "/iot/telemetry",
        json={"sensor_id": "SENSOR-1", "sensor_type": "pothole_depth_cm", "value": 12.0},
        headers={"X-IoT-Api-Key": "wrong-key"},
    )
    assert resp.status_code == 401


def test_telemetry_returns_503_when_unconfigured(client, monkeypatch):
    import app.routers.iot as iot_router
    monkeypatch.setattr(iot_router, "IOT_INGEST_API_KEY", "")

    resp = client.post(
        "/iot/telemetry",
        json={"sensor_id": "SENSOR-1", "sensor_type": "pothole_depth_cm", "value": 12.0},
        headers={"X-IoT-Api-Key": "anything"},
    )
    assert resp.status_code == 503


def test_normal_reading_creates_no_issue(client, monkeypatch):
    import app.routers.iot as iot_router
    monkeypatch.setattr(iot_router, "IOT_INGEST_API_KEY", "the-real-key")

    resp = client.post(
        "/iot/telemetry",
        json={"sensor_id": "SENSOR-NORMAL", "sensor_type": "pothole_depth_cm", "value": 1.0,
              "latitude": 12.9, "longitude": 77.5},
        headers={"X-IoT-Api-Key": "the-real-key"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "normal"


def test_threshold_breach_creates_a_real_issue(client, monkeypatch):
    import app.routers.iot as iot_router
    monkeypatch.setattr(iot_router, "IOT_INGEST_API_KEY", "the-real-key")

    resp = client.post(
        "/iot/telemetry",
        json={"sensor_id": "SENSOR-BREACH", "sensor_type": "pothole_depth_cm", "value": 14.0,
              "latitude": 12.9, "longitude": 77.5},
        headers={"X-IoT-Api-Key": "the-real-key"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "issue_created"
    assert body["category"] == "road_infrastructure"
    assert body["severity"] == "high"


def test_repeated_breach_does_not_spam_duplicate_issues(client, monkeypatch):
    import app.routers.iot as iot_router
    monkeypatch.setattr(iot_router, "IOT_INGEST_API_KEY", "the-real-key")
    headers = {"X-IoT-Api-Key": "the-real-key"}
    payload = {"sensor_id": "SENSOR-REPEAT", "sensor_type": "water_pipe_pressure_psi", "value": 10.0,
               "latitude": 12.9, "longitude": 77.5}

    first = client.post("/iot/telemetry", json=payload, headers=headers)
    second = client.post("/iot/telemetry", json=payload, headers=headers)

    assert first.json()["status"] == "issue_created"
    assert second.json()["status"] == "existing_issue_updated"
    assert second.json()["issue_id"] == first.json()["issue_id"]


def test_unknown_sensor_type_rejected(client, monkeypatch):
    import app.routers.iot as iot_router
    monkeypatch.setattr(iot_router, "IOT_INGEST_API_KEY", "the-real-key")

    resp = client.post(
        "/iot/telemetry",
        json={"sensor_id": "SENSOR-X", "sensor_type": "not_a_real_sensor_type", "value": 1.0},
        headers={"X-IoT-Api-Key": "the-real-key"},
    )
    assert resp.status_code == 400
