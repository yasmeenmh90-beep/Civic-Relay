from datetime import datetime
from app.models import Ticket


def is_sla_exceeded(ticket: Ticket) -> bool:
    if not ticket.sla_deadline:
        return False
    return datetime.utcnow() > ticket.sla_deadline
