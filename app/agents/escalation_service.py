from sqlalchemy.orm import Session

from app.models import Ticket, AgentLog, TicketStatus
from app.agents import escalation_agent


def draft_and_log_escalation(db: Session, ticket: Ticket) -> dict:
    """
    Escalation Agent drafts the escalation and the ticket moves to
    AWAITING_APPROVAL. Nothing is ever sent from here - only
    /tickets/{id}/approve-escalation (a human action) can do that.
    """
    result = escalation_agent.draft_escalation(ticket)
    ticket.status = TicketStatus.AWAITING_APPROVAL
    db.add(AgentLog(issue_id=ticket.issue_id, agent_name="Escalation Agent", action=result["log"]))
    db.commit()
    return result
