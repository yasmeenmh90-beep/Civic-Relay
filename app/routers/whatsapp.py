"""
WhatsApp reporting: citizens message your WhatsApp Business number instead
of using the web app. Meta calls this webhook; there's no user-facing auth
here (WhatsApp itself is the identity - phone number verified by Meta, not
by us) - security is the HMAC signature check on every POST, not a JWT.
"""
import logging
import secrets
from fastapi import APIRouter, Request, Response, Query, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Issue
from app.agents import whatsapp_client
from app.agents.orchestrator import run_report_pipeline
from app.auth import hash_password

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp"])
logger = logging.getLogger("civicrelay.whatsapp")


@router.get("")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """One-time handshake Meta performs when you register a webhook URL in
    the App Dashboard - not called by real users, only by Meta itself."""
    if not whatsapp_client.webhook_verification_configured():
        raise HTTPException(status_code=503, detail="WhatsApp webhook isn't configured on this deployment.")

    result = whatsapp_client.verify_challenge(hub_mode, hub_verify_token, hub_challenge)
    if result is None:
        raise HTTPException(status_code=403, detail="Verification failed")
    return Response(content=result, media_type="text/plain")


def _get_or_create_whatsapp_user(db: Session, phone: str, name: str) -> User:
    user = db.query(User).filter(User.phone == phone).first()
    if user:
        return user

    # WhatsApp users never log in with a password - their phone number,
    # verified by Meta, is their identity. Still populate password_hash to
    # satisfy the schema; it's an unguessable random value they'll never use.
    user = User(
        name=name or f"WhatsApp user {phone[-4:]}",
        email=f"whatsapp-{phone}@civicrelay.local",
        password_hash=hash_password(secrets.token_urlsafe(32)),
        phone=phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    if not whatsapp_client.webhook_verification_configured():
        raise HTTPException(status_code=503, detail="WhatsApp webhook isn't configured on this deployment.")

    raw_body = await request.body()
    signature = request.headers.get("x-hub-signature-256")
    if not whatsapp_client.verify_signature(raw_body, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")

    payload = await request.json()
    message = whatsapp_client.parse_incoming_message(payload)
    if not message:
        # Meta also posts delivery-status updates ("sent"/"delivered"/"read")
        # to this same webhook - not every POST is a new message to report.
        return {"status": "ignored"}

    if message["type"] == "location":
        whatsapp_client.send_text_message(
            message["from_phone"],
            "Thanks for sharing your location! Please also send a short "
            "text message describing the issue so I can log it.",
        )
        return {"status": "location_received_awaiting_description"}

    if message["type"] != "text" or not message.get("text"):
        whatsapp_client.send_text_message(
            message["from_phone"],
            "Sorry, I can only understand text messages right now - please "
            "describe the issue in words.",
        )
        return {"status": "unsupported_message_type"}

    user = _get_or_create_whatsapp_user(db, message["from_phone"], message["contact_name"])

    issue = Issue(user_id=user.id, description=message["text"])
    db.add(issue)
    db.commit()
    db.refresh(issue)

    run_report_pipeline(db, issue)
    db.refresh(issue)

    reply = (
        f"Thanks! I've logged this as a {issue.category.replace('_', ' ')} issue "
        f"({issue.severity} severity). Reference: {issue.ticket.external_ticket_id}. "
        f"I'll keep tracking it and follow up if there's no response in time."
    )
    whatsapp_client.send_text_message(message["from_phone"], reply)

    return {"status": "reported", "issue_id": issue.id}
