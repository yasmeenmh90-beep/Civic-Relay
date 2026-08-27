def _report_and_get_ticket_id(client, auth_headers, description="A civic issue."):
    resp = client.post("/issues", json={"description": description}, headers=auth_headers)
    return resp.json()["ticket"]["id"]


def test_sla_status_not_exceeded_initially(client, auth_headers):
    ticket_id = _report_and_get_ticket_id(client, auth_headers)
    resp = client.get(f"/tickets/{ticket_id}/sla-status", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["sla_exceeded"] is False


def test_escalate_before_sla_exceeded_rejected(client, auth_headers):
    ticket_id = _report_and_get_ticket_id(client, auth_headers)
    resp = client.post(f"/tickets/{ticket_id}/escalate", headers=auth_headers)
    assert resp.status_code == 400


def test_full_escalation_lifecycle(client, auth_headers):
    ticket_id = _report_and_get_ticket_id(client, auth_headers)

    # simulate SLA expiry
    resp = client.post(f"/tickets/{ticket_id}/simulate-sla-expiry", headers=auth_headers)
    assert resp.status_code == 200

    status = client.get(f"/tickets/{ticket_id}/sla-status", headers=auth_headers)
    assert status.json()["sla_exceeded"] is True

    # draft escalation
    escalate = client.post(f"/tickets/{ticket_id}/escalate", headers=auth_headers)
    assert escalate.status_code == 200
    assert escalate.json()["status"] == "awaiting_approval"
    assert "escalation_text" in escalate.json()

    # approve it
    approve = client.post(f"/tickets/{ticket_id}/approve-escalation", headers=auth_headers)
    assert approve.status_code == 200
    assert approve.json()["status"] == "escalated"

    # approving again should fail - nothing pending anymore
    approve_again = client.post(f"/tickets/{ticket_id}/approve-escalation", headers=auth_headers)
    assert approve_again.status_code == 400

    # resolve
    resolve = client.post(f"/tickets/{ticket_id}/resolve", headers=auth_headers)
    assert resolve.status_code == 200
    assert resolve.json()["status"] == "resolved"


def test_ticket_actions_require_ownership(client, auth_headers):
    ticket_id = _report_and_get_ticket_id(client, auth_headers)

    client.post("/users", json={"name": "Other", "email": "other@civicrelay.io", "password": "otherpass1"})
    other_login = client.post("/users/login", json={"email": "other@civicrelay.io", "password": "otherpass1"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    resp = client.get(f"/tickets/{ticket_id}/sla-status", headers=other_headers)
    assert resp.status_code == 403


def test_ticket_not_found(client, auth_headers):
    resp = client.get("/tickets/does-not-exist/sla-status", headers=auth_headers)
    assert resp.status_code == 404
