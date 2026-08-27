from app.agents import municipal_api


def test_not_available_when_unconfigured(monkeypatch):
    monkeypatch.setattr(municipal_api, "MUNICIPAL_API_BASE_URL", "")
    assert municipal_api.municipal_api_available() is False


def test_submit_returns_none_when_unconfigured(monkeypatch):
    monkeypatch.setattr(municipal_api, "MUNICIPAL_API_BASE_URL", "")
    result = municipal_api.submit_service_request("road_infrastructure", "A pothole.", 12.9, 77.5)
    assert result is None


def test_submit_parses_service_request_id(monkeypatch):
    """Simulates a well-formed Open311 response without hitting the network."""
    monkeypatch.setattr(municipal_api, "MUNICIPAL_API_BASE_URL", "https://fake-city.example/open311/v2")

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return [{"service_request_id": "638344", "service_notice": "Thanks for reporting."}]

    def fake_post(url, data, timeout):
        assert url == "https://fake-city.example/open311/v2/requests.json"
        assert data["service_code"] == municipal_api.CATEGORY_TO_SERVICE_CODE["road_infrastructure"]
        return FakeResponse()

    monkeypatch.setattr(municipal_api.requests, "post", fake_post)

    result = municipal_api.submit_service_request("road_infrastructure", "A pothole.", 12.9, 77.5)
    assert result == {"service_request_id": "638344", "service_notice": "Thanks for reporting."}


def test_submit_handles_token_response(monkeypatch):
    """Some jurisdictions return an async token instead of an immediate id."""
    monkeypatch.setattr(municipal_api, "MUNICIPAL_API_BASE_URL", "https://fake-city.example/open311/v2")

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return [{"token": "abc123"}]

    monkeypatch.setattr(municipal_api.requests, "post", lambda url, data, timeout: FakeResponse())

    result = municipal_api.submit_service_request("waste_management", "Garbage overflow.", None, None)
    assert result["service_request_id"] == "token:abc123"


def test_submit_falls_back_to_none_on_network_error(monkeypatch):
    import requests as requests_lib
    monkeypatch.setattr(municipal_api, "MUNICIPAL_API_BASE_URL", "https://fake-city.example/open311/v2")

    def raise_connection_error(url, data, timeout):
        raise requests_lib.ConnectionError("simulated network failure")

    monkeypatch.setattr(municipal_api.requests, "post", raise_connection_error)

    result = municipal_api.submit_service_request("road_infrastructure", "A pothole.", 12.9, 77.5)
    assert result is None  # never raises - caller falls back to a local ticket ref
