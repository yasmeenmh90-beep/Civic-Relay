def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "database": "ok"}


def test_health_returns_503_when_db_unreachable(client, monkeypatch):
    import app.main as main_module

    class BrokenSession:
        def execute(self, *a, **kw):
            raise Exception("simulated connection failure")

        def close(self):
            pass

    monkeypatch.setattr(main_module, "SessionLocal", lambda: BrokenSession())

    resp = client.get("/health")
    assert resp.status_code == 503
    assert resp.json() == {"status": "degraded", "database": "unreachable"}


def test_response_includes_request_id_header(client):
    resp = client.get("/health")
    assert "x-request-id" in resp.headers
    assert len(resp.headers["x-request-id"]) == 8
