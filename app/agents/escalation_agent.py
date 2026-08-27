"""
Escalation Agent: drafts an escalation when a ticket's SLA is exceeded.
Never sends anything itself - that always requires human approval
(see app/agents/escalation_service.py and /tickets/{id}/approve-escalation).
"""
import logging
from datetime import datetime
from app.models import Ticket
from app.agents.strands_client import strands_available, get_strands_agent

logger = logging.getLogger("civicrelay.escalation")

SYSTEM_PROMPT = (
    "You are the Escalation Agent for CivicRelay. A ticket has exceeded its "
    "expected SLA with no response from the responsible authority. Draft a "
    "short, professional escalation message (2-3 sentences) requesting "
    "priority review. Reference the ticket number, the authority, and how "
    "many hours overdue it is. This message will be reviewed by a human "
    "before being sent - do not claim it has already been sent."
)


def _template_escalation(ticket: Ticket, overdue_hours: int) -> str:
    return (
        f"Escalation for ticket {ticket.external_ticket_id}: expected SLA exceeded by "
        f"{overdue_hours}h with no response from {ticket.authority}. Requesting priority review."
    )


def draft_escalation(ticket: Ticket) -> dict:
    overdue_hours = 0
    if ticket.sla_deadline:
        overdue_hours = max(0, int((datetime.utcnow() - ticket.sla_deadline).total_seconds() // 3600))

    text, source = None, "fallback"

    if strands_available():
        try:
            agent = get_strands_agent(SYSTEM_PROMPT)
            prompt = (
                f"Ticket: {ticket.external_ticket_id}. Authority: {ticket.authority}. "
                f"Overdue by: {overdue_hours} hours."
            )
            result = agent(prompt)
            text = str(result).strip()
            source = "strands"
        except Exception as exc:
            logger.warning("Escalation Agent: Strands call failed, falling back to template: %s", exc)

    if not text:
        text = _template_escalation(ticket, overdue_hours)

    return {
        "escalation_text": text,
        "overdue_hours": overdue_hours,
        "log": f"Escalation drafted. SLA exceeded by {overdue_hours}h. Awaiting human approval. ({source})",
    }
