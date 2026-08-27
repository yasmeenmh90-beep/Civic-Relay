from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Ticket, Issue, AgentLog, TicketStatus, User
from app.agents import tracking_agent
from app.agents.escalation_service import draft_and_log_escalation
from app.deps import get_current_user

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _log(db: Session, issue_id: str, agent_name: str, action: str):
    db.add(AgentLog(issue_id=issue_id, agent_name=agent_name, action=action))
    db.commit()


def _get_owned_ticket(db: Session, ticket_id: str, current_user: User) -> Ticket:
    """Fetches a ticket and verifies it belongs to an issue reported by current_user."""
    ticket = (
        db.query(Ticket)
        .join(Issue, Ticket.issue_id == Issue.id)
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.issue.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your ticket")
    return ticket


@router.post("/{ticket_id}/simulate-sla-expiry")
def simulate_sla_expiry(ticket_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Demo-only: fast-forwards a ticket's SLA deadline into the past."""
    ticket = _get_owned_ticket(db, ticket_id, current_user)
    ticket.sla_deadline = datetime.utcnow() - timedelta(hours=1)
    db.commit()
    return {"ticket_id": ticket.id, "sla_deadline": ticket.sla_deadline}


@router.get("/{ticket_id}/sla-status")
def sla_status(ticket_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = _get_owned_ticket(db, ticket_id, current_user)
    exceeded = tracking_agent.is_sla_exceeded(ticket)
    return {"ticket_id": ticket.id, "sla_exceeded": exceeded, "sla_deadline": ticket.sla_deadline}


@router.post("/{ticket_id}/escalate")
def draft_escalation(ticket_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Manual trigger: Escalation Agent drafts an escalation - does NOT send it. Requires approval.
    Normally the background Tracking Agent sweep does this automatically once
    the SLA is exceeded; this endpoint exists for a manual/demo override."""
    ticket = _get_owned_ticket(db, ticket_id, current_user)
    if not tracking_agent.is_sla_exceeded(ticket):
        raise HTTPException(status_code=400, detail="SLA has not been exceeded yet")

    result = draft_and_log_escalation(db, ticket)
    return {"ticket_id": ticket.id, "status": ticket.status, "escalation_text": result["escalation_text"]}


@router.post("/{ticket_id}/approve-escalation")
def approve_escalation(ticket_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Human approves the drafted escalation. This is where it would actually be sent."""
    ticket = _get_owned_ticket(db, ticket_id, current_user)
    if ticket.status != TicketStatus.AWAITING_APPROVAL:
        raise HTTPException(status_code=400, detail="No escalation is awaiting approval for this ticket")

    ticket.status = TicketStatus.ESCALATED
    db.commit()
    _log(db, ticket.issue_id, "Escalation Agent", "Escalation approved by user and sent to authority.")
    return {"ticket_id": ticket.id, "status": ticket.status}


@router.post("/{ticket_id}/resolve")
def resolve_ticket(ticket_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = _get_owned_ticket(db, ticket_id, current_user)
    ticket.status = TicketStatus.RESOLVED
    ticket.resolved_at = datetime.utcnow()
    db.commit()
    _log(db, ticket.issue_id, "Tracking Agent", "Case marked resolved.")
    return {"ticket_id": ticket.id, "status": ticket.status}
