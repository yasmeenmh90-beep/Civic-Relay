import hmac
import hashlib
import json

from app.agents import whatsapp_client


# --- Challenge handshake (pure logic, no network) ---

def test_verify_challenge_correct_token():
    whatsapp_client.WHATSAPP_VERIFY_TOKEN = "my-secret-token"
    result = whatsapp_client.verify_challenge("subscribe", "my-secret-token", "12345")
    assert result == "12345"


def test_verify_challenge_wrong_token():
    whatsapp_client.WHATSAPP_VERIFY_TOKEN = "my-secret-token"
    result = whatsapp_client.verify_challenge("subscribe", "wrong-token", "12345")
    assert result is None


def test_verify_challenge_wrong_mode():
    whatsapp_client.WHATSAPP_VERIFY_TOKEN = "my-secret-token"
    result = whatsapp_client.verify_challenge("unsubscribe", "my-secret-token", "12345")
    assert result is None


# --- Signature verification (real HMAC math, no network) ---

def test_verify_signature_correct():
    whatsapp_client.WHATSAPP_APP_SECRET = "my-app-secret"
    body = b'{"object":"whatsapp_business_account","entry":[]}'
    expected_sig = "sha256=" + hmac.new(b"my-app-secret", body, hashlib.sha256).hexdigest()
    assert whatsapp_client.verify_signature(body, expected_sig) is True


def test_verify_signature_wrong_secret():
    whatsapp_client.WHATSAPP_APP_SECRET = "my-app-secret"
    body = b'{"object":"whatsapp_business_account","entry":[]}'
    wrong_sig = "sha256=" + hmac.new(b"wrong-secret", body, hashlib.sha256).hexdigest()
    assert whatsapp_client.verify_signature(body, wrong_sig) is False


def test_verify_signature_tampered_body():
    whatsapp_client.WHATSAPP_APP_SECRET = "my-app-secret"
    original_body = b'{"messages":[{"text":"pothole"}]}'
    sig_for_original = "sha256=" + hmac.new(b"my-app-secret", original_body, hashlib.sha256).hexdigest()
    tampered_body = b'{"messages":[{"text":"NOT a pothole, spam"}]}'
    assert whatsapp_client.verify_signature(tampered_body, sig_for_original) is False


def test_verify_signature_missing_header():
    whatsapp_client.WHATSAPP_APP_SECRET = "my-app-secret"
    assert whatsapp_client.verify_signature(b"anything", None) is False


def test_verify_signature_malformed_header():
    whatsapp_client.WHATSAPP_APP_SECRET = "my-app-secret"
    assert whatsapp_client.verify_signature(b"anything", "not-the-right-format") is False


# --- Message parsing (real Meta payload shapes, no network) ---

def _wrap_message(message_obj, contact_name="Test Citizen"):
    return {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "102290129340398",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"display_phone_number": "15550783881", "phone_number_id": "106540352242922"},
                    "contacts": [{"profile": {"name": contact_name}, "wa_id": "16505551234"}],
                    "messages": [message_obj],
                },
                "field": "messages",
            }],
        }],
    }


def test_parse_text_message():
    payload = _wrap_message({
        "from": "16505551234", "id": "wamid.ABC", "timestamp": "1749416383",
        "type": "text", "text": {"body": "There is a large pothole near me."},
    })
    result = whatsapp_client.parse_incoming_message(payload)
    assert result["from_phone"] == "16505551234"
    assert result["contact_name"] == "Test Citizen"
    assert result["type"] == "text"
    assert result["text"] == "There is a large pothole near me."


def test_parse_location_message():
    payload = _wrap_message({
        "from": "16505551234", "id": "wamid.DEF", "timestamp": "1749416400",
        "type": "location", "location": {"latitude": 12.9, "longitude": 77.5},
    })
    result = whatsapp_client.parse_incoming_message(payload)
    assert result["type"] == "location"
    assert result["latitude"] == 12.9
    assert result["longitude"] == 77.5


def test_parse_unsupported_message_type():
    payload = _wrap_message({
        "from": "16505551234", "id": "wamid.GHI", "timestamp": "1749416500",
        "type": "audio", "audio": {"id": "media123"},
    })
    result = whatsapp_client.parse_incoming_message(payload)
    assert result["type"] == "audio"
    assert result["text"] is None


def test_parse_status_update_returns_none():
    """A delivery-status webhook has no 'messages' key - not a new report."""
    payload = {
        "object": "whatsapp_business_account",
        "entry": [{"changes": [{"value": {"statuses": [{"status": "delivered"}]}, "field": "messages"}]}],
    }
    assert whatsapp_client.parse_incoming_message(payload) is None


def test_parse_malformed_payload_returns_none():
    assert whatsapp_client.parse_incoming_message({"garbage": True}) is None


# --- Sending (verified via a live network call with fake creds in the manual proof; unit test covers the guard) ---

def test_send_returns_false_when_unconfigured(monkeypatch):
    monkeypatch.setattr(whatsapp_client, "WHATSAPP_ACCESS_TOKEN", "")
    monkeypatch.setattr(whatsapp_client, "WHATSAPP_PHONE_NUMBER_ID", "")
    assert whatsapp_client.send_text_message("16505551234", "test") is False


# --- Full webhook POST flow (through the actual FastAPI route) ---

def test_webhook_get_verification_success(client, monkeypatch):
    import app.routers.whatsapp as wa_router
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_APP_SECRET", "secret")
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_VERIFY_TOKEN", "verify-me")

    resp = client.get("/webhooks/whatsapp", params={
        "hub.mode": "subscribe", "hub.verify_token": "verify-me", "hub.challenge": "999888",
    })
    assert resp.status_code == 200
    assert resp.text == "999888"


def test_webhook_get_verification_wrong_token(client, monkeypatch):
    import app.routers.whatsapp as wa_router
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_APP_SECRET", "secret")
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_VERIFY_TOKEN", "verify-me")

    resp = client.get("/webhooks/whatsapp", params={
        "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "999888",
    })
    assert resp.status_code == 403


def test_webhook_post_rejects_bad_signature(client, monkeypatch):
    import app.routers.whatsapp as wa_router
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_APP_SECRET", "secret")
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_VERIFY_TOKEN", "verify-me")

    resp = client.post(
        "/webhooks/whatsapp",
        content=b'{"object":"whatsapp_business_account","entry":[]}',
        headers={"X-Hub-Signature-256": "sha256=wrongsignature"},
    )
    assert resp.status_code == 403


def test_webhook_post_creates_issue_and_replies(client, monkeypatch):
    import app.routers.whatsapp as wa_router
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_APP_SECRET", "secret")
    monkeypatch.setattr(wa_router.whatsapp_client, "WHATSAPP_VERIFY_TOKEN", "verify-me")

    sent_replies = []
    monkeypatch.setattr(
        wa_router.whatsapp_client, "send_text_message",
        lambda phone, body: sent_replies.append((phone, body)) or True,
    )

    body_dict = _wrap_message({
        "from": "16505551234", "id": "wamid.XYZ", "timestamp": "1749416600",
        "type": "text", "text": {"body": "There is a large dangerous pothole near this location."},
    })
    raw_body = json.dumps(body_dict).encode("utf-8")
    signature = "sha256=" + hmac.new(b"secret", raw_body, hashlib.sha256).hexdigest()

    resp = client.post("/webhooks/whatsapp", content=raw_body, headers={"X-Hub-Signature-256": signature})
    assert resp.status_code == 200
    assert resp.json()["status"] == "reported"

    assert len(sent_replies) == 1
    phone, reply_text = sent_replies[0]
    assert phone == "16505551234"
    assert "road infrastructure" in reply_text
    assert "CIV-2026-" in reply_text
