def _make_staff(client, monkeypatch, code):
    import app.routers.users as users_router
    monkeypatch.setattr(users_router, "STAFF_SIGNUP_CODE", code)
    email = f"staff-{code}@civicrelay.io"
    client.post("/users", json={"name": "Staffer", "email": email, "password": "pass1234", "staff_code": code})
    login = client.post("/users/login", json={"email": email, "password": "pass1234"})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


# --- Role gating ---

def test_signup_without_staff_code_is_citizen(client):
    resp = client.post("/users", json={"name": "Citizen", "email": "citizen1@civicrelay.io", "password": "pass1234"})
    assert resp.json()["role"] == "citizen"


def test_signup_with_wrong_staff_code_stays_citizen(client, monkeypatch):
    import app.routers.users as users_router
    monkeypatch.setattr(users_router, "STAFF_SIGNUP_CODE", "correct-code")

    resp = client.post("/users", json={
        "name": "Citizen", "email": "citizen2@civicrelay.io", "password": "pass1234", "staff_code": "wrong-code",
    })
    assert resp.json()["role"] == "citizen"


def test_signup_with_correct_staff_code_becomes_staff(client, monkeypatch):
    import app.routers.users as users_router
    monkeypatch.setattr(users_router, "STAFF_SIGNUP_CODE", "correct-code")

    resp = client.post("/users", json={
        "name": "Staffer", "email": "staff2@civicrelay.io", "password": "pass1234", "staff_code": "correct-code",
    })
    assert resp.json()["role"] == "staff"


def test_citizen_forbidden_from_analytics(client, auth_headers):
    resp = client.get("/analytics/overview", headers=auth_headers)
    assert resp.status_code == 403


def test_analytics_requires_auth_at_all(client):
    resp = client.get("/analytics/overview")
    assert resp.status_code in (401, 403)


def test_staff_code_never_matches_when_unconfigured(client, monkeypatch):
    """If STAFF_SIGNUP_CODE isn't set on the server, no submitted code should
    ever grant staff - empty string must never match empty string."""
    import app.routers.users as users_router
    monkeypatch.setattr(users_router, "STAFF_SIGNUP_CODE", "")

    resp = client.post("/users", json={
        "name": "Sneaky", "email": "sneaky@civicrelay.io", "password": "pass1234", "staff_code": "",
    })
    assert resp.json()["role"] == "citizen"


# --- Aggregation correctness ---

def test_overview_reflects_real_reported_issues(client, auth_headers, monkeypatch):
    staff_headers = _make_staff(client, monkeypatch, "code123")

    client.post("/issues", json={"description": "A pothole here."}, headers=auth_headers)
    client.post("/issues", json={"description": "Garbage overflow."}, headers=auth_headers)

    resp = client.get("/analytics/overview", headers=staff_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_issues"] == 2
    assert body["open_issues"] == 2
    assert body["resolved_issues"] == 0
    assert body["by_category"]["road_infrastructure"] == 1
    assert body["by_category"]["waste_management"] == 1
    assert body["by_source"]["citizen_report"] == 2


def test_overview_tracks_resolution_and_sla_compliance(client, auth_headers, monkeypatch):
    staff_headers = _make_staff(client, monkeypatch, "code456")

    report = client.post("/issues", json={"description": "A pothole here."}, headers=auth_headers)
    ticket_id = report.json()["ticket"]["id"]
    client.post(f"/tickets/{ticket_id}/resolve", headers=auth_headers)

    resp = client.get("/analytics/overview", headers=staff_headers)
    body = resp.json()
    assert body["resolved_issues"] == 1
    assert body["open_issues"] == 0
    assert body["avg_resolution_hours"] is not None
    assert body["sla_compliance_rate"] == 100.0  # resolved immediately, well before any SLA deadline


def test_trends_returns_continuous_daily_series(client, monkeypatch):
    staff_headers = _make_staff(client, monkeypatch, "code789")
    resp = client.get("/analytics/trends?days=7", headers=staff_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 8  # days=7 means 7 days back through today inclusive
    assert all("date" in point and "count" in point for point in body)


def test_by_authority_groups_correctly(client, auth_headers, monkeypatch):
    staff_headers = _make_staff(client, monkeypatch, "codeABC")

    client.post("/issues", json={"description": "A pothole here."}, headers=auth_headers)
    client.post("/issues", json={"description": "Another pothole nearby."}, headers=auth_headers)
    client.post("/issues", json={"description": "Garbage overflow."}, headers=auth_headers)

    resp = client.get("/analytics/by-authority", headers=staff_headers)
    body = resp.json()
    roads = next(r for r in body if r["authority"] == "Municipal Roads Department")
    assert roads["total"] == 2


def test_map_shows_individual_issues_not_grouped(client, auth_headers, monkeypatch):
    staff_headers = _make_staff(client, monkeypatch, "codeDEF")

    client.post("/issues", json={
        "description": "A pothole here.", "latitude": 10.0, "longitude": 10.0
    }, headers=auth_headers)
    client.post("/issues", json={
        "description": "Another pothole right nearby.", "latitude": 10.0001, "longitude": 10.0001
    }, headers=auth_headers)

    resp = client.get("/analytics/map", headers=staff_headers)
    body = resp.json()
    assert len(body) == 2  # unlike /issues/clusters, these are NOT grouped into one
