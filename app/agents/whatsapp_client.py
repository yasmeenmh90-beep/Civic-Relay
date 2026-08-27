"""
WhatsApp Cloud API integration (Meta's Graph API for WhatsApp Business).

Two directions:
- Incoming: Meta POSTs webhook payloads to /webhooks/whatsapp when a citizen
  messages your WhatsApp number. verify_signature() and parse_incoming_message()
  handle that.
- Outgoing: send_text_message() calls the real Graph API to reply.

Requires WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID (for sending) and
WHATSAPP_APP_SECRET + WHATSAPP_VERIFY_TOKEN (for receiving/verifying
webhooks) - all from a Meta Developer App's WhatsApp product. Without these,
whatsapp_available() is False and the webhook route returns 503 rather than
pretending to work - see README for how to get real values.
"""
import os
import hmac
import hashlib
import logging
import requests

logger = logging.getLogger("civicrelay.whatsapp")

WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
GRAPH_API_VERSION = os.getenv("WHATSAPP_GRAPH_API_VERSION", "v21.0")


def whatsapp_available() -> bool:
    return bool(WHATSAPP_ACCESS_TOKEN) and bool(WHATSAPP_PHONE_NUMBER_ID)


def webhook_verification_configured() -> bool:
    return bool(WHATSAPP_APP_SECRET) and bool(WHATSAPP_VERIFY_TOKEN)


def verify_challenge(mode: str, token: str, challenge: str) -> str | None:
    """Handles Meta's one-time GET verification handshake when you register
    a webhook URL. Returns the challenge string to echo back on success, or
    None if verification should be rejected (caller returns 403)."""
    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        return challenge
    return None


def verify_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """
    Verifies the X-Hub-Signature-256 header Meta sends on every webhook POST,
    proving the request genuinely came from Meta and wasn't forged. Format:
    "sha256=<hex digest>", computed as HMAC-SHA256 of the raw request body
    using your app secret. Uses hmac.compare_digest to avoid timing attacks.
    """
    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected = hmac.new(WHATSAPP_APP_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    provided = signature_header[len("sha256="):]
    return hmac.compare_digest(expected, provided)


def parse_incoming_message(payload: dict) -> dict | None:
    """
    Extracts the first message from a Meta webhook POST body. Returns
    {"from_phone": str, "contact_name": str, "type": "text"|"location", ...}
    or None if the payload doesn't contain an actual message (e.g. it's a
    delivery-status update instead - Meta sends those to the same webhook).
    """
    try:
        entry = payload["entry"][0]
        change = entry["changes"][0]
        value = change["value"]
        messages = value.get("messages")
        if not messages:
            return None  # e.g. a status update ("delivered", "read"), not a new message

        message = messages[0]
        contacts = value.get("contacts", [{}])
        contact_name = contacts[0].get("profile", {}).get("name", "") if contacts else ""

        result = {
            "from_phone": message["from"],
            "contact_name": contact_name,
            "message_id": message["id"],
            "type": message["type"],
        }

        if message["type"] == "text":
            result["text"] = message["text"]["body"]
        elif message["type"] == "location":
            loc = message["location"]
            result["latitude"] = loc["latitude"]
            result["longitude"] = loc["longitude"]
        else:
            # audio/image/document etc. - real extension point (would need
            # Meta's media download endpoint) but not wired up in this pass.
            result["text"] = None

        return result

    except (KeyError, IndexError, TypeError):
        return None


def send_text_message(to_phone: str, body: str) -> bool:
    """Real Graph API call. Returns True on success, False on any failure -
    never raises, since a failed reply shouldn't break the report pipeline
    that already succeeded before this is called."""
    if not whatsapp_available():
        return False

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"body": body},
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.warning("WhatsApp: failed to send reply to %s: %s", to_phone, exc)
        return False
