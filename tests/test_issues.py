def test_report_issue_requires_auth(client):
    resp = client.post("/issues", json={"description": "Trying to sneak a report in."})
    assert resp.status_code in (401, 403)


def test_report_pothole_classified_correctly(client, auth_headers):
    resp = client.post(
        "/issues",
        json={"description": "There is a large dangerous pothole near this location, cars keep hitting it."},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["category"] == "road_infrastructure"
    assert body["severity"] == "high"  # "dangerous" triggers high severity
    assert body["ticket"]["authority"] == "Municipal Roads Department"
    assert body["ticket"]["external_ticket_id"].startswith("CIV-2026-")
    assert body["ticket"]["status"] == "waiting_for_authority"
    # all 4 pipeline agents should have logged something
    agent_names = {log["agent_name"] for log in body["logs"]}
    assert agent_names == {"Triage Agent", "Research Agent", "Action Agent", "Tracking Agent"}


def test_report_streetlight_not_misclassified_as_road(client, auth_headers):
    """Regression test: 'streetlight on main road' was previously misclassified
    as road_infrastructure because 'road' matched before 'streetlight' did."""
    resp = client.post(
        "/issues",
        json={"description": "Broken streetlight on main road, dangerous at night."},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["category"] == "electrical_infrastructure"


def test_report_hole_classified_as_road_infrastructure(client, auth_headers):
    """Regression test: 'hole' alone (not just 'pothole') should still match
    road_infrastructure so it clusters correctly with other pothole reports."""
    resp = client.post(
        "/issues",
        json={"description": "Dangerous hole near the King Street junction."},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["category"] == "road_infrastructure"


def test_list_issues_returns_only_own_issues(client, auth_headers):
    client.post("/issues", json={"description": "My pothole."}, headers=auth_headers)

    client.post("/users", json={"name": "Other", "email": "other@civicrelay.io", "password": "otherpass1"})
    other_login = client.post("/users/login", json={"email": "other@civicrelay.io", "password": "otherpass1"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}
    client.post("/issues", json={"description": "Their garbage problem."}, headers=other_headers)

    resp = client.get("/issues", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["description"] == "My pothole."


def test_get_issue_not_found(client, auth_headers):
    resp = client.get("/issues/does-not-exist", headers=auth_headers)
    assert resp.status_code == 404


def test_get_other_users_issue_forbidden(client, auth_headers):
    report = client.post("/issues", json={"description": "My pothole."}, headers=auth_headers)
    issue_id = report.json()["id"]

    client.post("/users", json={"name": "Other", "email": "other@civicrelay.io", "password": "otherpass1"})
    other_login = client.post("/users/login", json={"email": "other@civicrelay.io", "password": "otherpass1"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    resp = client.get(f"/issues/{issue_id}", headers=other_headers)
    assert resp.status_code == 403
