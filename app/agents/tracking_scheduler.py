"""
Background Tracking Agent.

Periodically scans every ticket that's still open (not yet escalated,
awaiting approval, or resolved) and checks whether its SLA has been
exceeded. If so, it hands off to the Escalation Agent to draft an
escalation - it never sends anything on its own; that still requires
a human to call /tickets/{id}/approve-escalation.

This turns the previously on-demand "/sla-status" check into something
that actually runs in the background, matching the plan's "Tracking
Agent monitors ticket status daily" behaviour (interval is configurable
for demo purposes - real deployments would run this hourly/daily, the
hackathon demo runs it every few seconds against a simulated SLA).
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler

from app.db import SessionLocal
from app.models import Ticket, TicketStatus
from app.agents import tracking_agent
from app.agents.escalation_service import draft_and_log_escalation

logger = logging.getLogger("civicrelay.tracking")

OPEN_STATUSES = [TicketStatus.SUBMITTED, TicketStatus.WAITING_FOR_AUTHORITY, TicketStatus.IN_PROGRESS]


def check_all_open_tickets():
    db = SessionLocal()
    try:
        open_tickets = db.query(Ticket).filter(Ticket.status.in_(OPEN_STATUSES)).all()
        for ticket in open_tickets:
            if tracking_agent.is_sla_exceeded(ticket):
                draft_and_log_escalation(db, ticket)
                logger.info("Tracking Agent: escalation drafted for ticket %s", ticket.id)
    finally:
        db.close()


_scheduler: BackgroundScheduler | None = None


def start_scheduler(interval_seconds: int = 30):
    global _scheduler
    if _scheduler is not None:
        return  # already running - avoid double-scheduling on reload

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(check_all_open_tickets, "interval", seconds=interval_seconds, id="tracking_agent_sweep")
    _scheduler.start()
    logger.info("Tracking Agent background sweep started (every %ss)", interval_seconds)


def stop_scheduler():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
