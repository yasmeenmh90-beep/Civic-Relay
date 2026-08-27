def test_signup_creates_user(client):
    resp = client.post("/users", json={"name": "Sai", "email": "sai@civicrelay.io", "password": "hunter22"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Sai"
    assert body["email"] == "sai@civicrelay.io"
    assert "password" not in body
    assert "password_hash" not in body


def test_signup_duplicate_email_rejected(client):
    client.post("/users", json={"name": "Sai", "email": "sai@civicrelay.io", "password": "hunter22"})
    resp = client.post("/users", json={"name": "Sai2", "email": "sai@civicrelay.io", "password": "different"})
    assert resp.status_code == 409


def test_login_wrong_password_rejected(client):
    client.post("/users", json={"name": "Sai", "email": "sai@civicrelay.io", "password": "hunter22"})
    resp = client.post("/users/login", json={"email": "sai@civicrelay.io", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_email_rejected(client):
    resp = client.post("/users/login", json={"email": "nobody@civicrelay.io", "password": "whatever"})
    assert resp.status_code == 401


def test_login_correct_credentials_returns_token(client):
    client.post("/users", json={"name": "Sai", "email": "sai@civicrelay.io", "password": "hunter22"})
    resp = client.post("/users/login", json={"email": "sai@civicrelay.io", "password": "hunter22"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert resp.json()["token_type"] == "bearer"


def test_me_requires_auth(client):
    resp = client.get("/users/me")
    assert resp.status_code in (401, 403)


def test_me_returns_current_user(client, auth_headers):
    resp = client.get("/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@civicrelay.io"


def test_me_rejects_garbage_token(client):
    resp = client.get("/users/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401
