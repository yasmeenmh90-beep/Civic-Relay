"""
Action Agent: converts the citizen's informal description into a
professionally worded civic complaint.

Primary path: a real strands.Agent generates the complaint text.
Fallback path (no AWS creds): a deterministic template. Still a real,
submission-quality complaint - just not LLM-authored.
"""
import logging
import random
import string

from app.agents.strands_client import strands_available, get_strands_agent
from app.agents.municipal_api import municipal_api_available, submit_service_request

logger = logging.getLogger("civicrelay.action")

SYSTEM_PROMPT = (
    "You are the Action Agent for CivicRelay. Rewrite the citizen's informal "
    "civic issue report into a short, formal complaint addressed to a "
    "municipal authority. Include a one-line subject line starting with "
    "'Subject:' followed by a 2-3 sentence body. Be factual and professional, "
    "and do not invent details not present in the citizen's report. The "
    "citizen's report may be in any language - always write the formal "
    "complaint itself in English, since it will be submitted to an "
    "English-speaking municipal authority, regardless of what language the "
    "citizen reported in."
)


def _template_complaint(description: str, category: str, severity: str) -> str:
    """Deterministic offline fallback - a real submission-quality template."""
    subject_map = {
        "road_infrastructure": "Road Damage Requiring Repair",
        "waste_management": "Urgent Waste Collection Request",
        "water_authority": "Water Infrastructure Issue Report",
        "electrical_infrastructure": "Electrical Infrastructure Fault Report",
        "other": "Civic Infrastructure Issue Report",
    }
    subject = subject_map.get(category, subject_map["other"])
    urgency_note = " This issue has been flagged as high severity and warrants prompt attention." if severity in ("high", "emergency") else ""

    return (
        f"Subject: {subject}\n\n"
        f"A civic issue has been reported at the specified location: {description.strip()} "
        f"We request inspection and appropriate corrective action at the earliest opportunity."
        f"{urgency_note}"
    )


def _generate_local_ticket_ref() -> str:
    suffix = "".join(random.choices(string.digits, k=4))
    return f"CIV-2026-{suffix}"


def run(description: str, category: str, severity: str, latitude: float | None = None, longitude: float | None = None) -> dict:
    complaint_text, source = None, "fallback"

    if strands_available():
        try:
            agent = get_strands_agent(SYSTEM_PROMPT)
            user_prompt = f"Category: {category}. Severity: {severity}. Citizen report: {description}"
            result = agent(user_prompt)
            complaint_text = str(result).strip()
            source = "strands"
        except Exception as exc:
            logger.warning("Action Agent: Strands call failed, falling back to template: %s", exc)

    if not complaint_text:
        complaint_text = _template_complaint(description, category, severity)

    # Real Open311 submission when a municipal endpoint is configured;
    # otherwise (the default) fall back to a locally generated reference,
    # same as before this integration existed.
    municipal_result = None
    if municipal_api_available():
        municipal_result = submit_service_request(category, description, latitude, longitude)

    if municipal_result:
        external_ticket_id = municipal_result["service_request_id"]
        log = f"Generated formal complaint. Submitted to municipal Open311 API. Reference: {external_ticket_id}. ({source})"
    else:
        external_ticket_id = _generate_local_ticket_ref()
        note = "no municipal API configured" if not municipal_api_available() else "municipal API submission failed"
        log = f"Generated formal complaint. Ticket reference: {external_ticket_id} (simulated - {note}). ({source})"

    return {
        "complaint_text": complaint_text,
        "external_ticket_id": external_ticket_id,
        "log": log,
    }
