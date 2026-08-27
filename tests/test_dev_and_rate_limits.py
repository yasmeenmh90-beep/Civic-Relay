def test_dev_reset_wipes_and_reseeds(client, auth_headers):
    client.post("/issues", json={"description": "Stale data from before reset."}, headers=auth_headers)

    resp = client.post("/dev/reset")
    assert resp.status_code == 200
    body = resp.json()
    assert body["demo_user_email"] == "demo@civicrelay.io"
    assert "access_token" in body

    # the returned token should actually work
    new_headers = {"Authorization": f"Bearer {body['access_token']}"}
    me = client.get("/users/me", headers=new_headers)
    assert me.status_code == 200
    assert me.json()["email"] == "demo@civicrelay.io"

    # old data should be gone - old token's user no longer exists
    old_me = client.get("/users/me", headers=auth_headers)
    assert old_me.status_code == 401


def test_dev_reset_password_also_works_via_login(client):
    reset = client.post("/dev/reset").json()
    login = client.post(
        "/users/login",
        json={"email": reset["demo_user_email"], "password": reset["demo_password"]},
    )
    assert login.status_code == 200


def test_report_issue_rate_limited(client, auth_headers):
    """Limit is 10/minute per user - the 11th call in quick succession should 429."""
    codes = []
    for i in range(11):
        resp = client.post("/issues", json={"description": f"issue number {i}"}, headers=auth_headers)
        codes.append(resp.status_code)
    assert codes[:10] == [200] * 10
    assert codes[10] == 429


def test_rate_limit_is_per_user_not_global(client, auth_headers):
    for i in range(10):
        client.post("/issues", json={"description": f"issue {i}"}, headers=auth_headers)
    # user1 is now at their limit
    blocked = client.post("/issues", json={"description": "one too many"}, headers=auth_headers)
    assert blocked.status_code == 429

    # a different user should be unaffected
    client.post("/users", json={"name": "Other", "email": "other@civicrelay.io", "password": "otherpass1"})
    other_login = client.post("/users/login", json={"email": "other@civicrelay.io", "password": "otherpass1"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}
    other_resp = client.post("/issues", json={"description": "fresh limit"}, headers=other_headers)
    assert other_resp.status_code == 200
