from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models import Issue, Ticket, AgentLog, TicketStatus, Severity
from app.agents import triage_agent, research_agent, action_agent, clustering


def _log(db: Session, issue_id: str, agent_name: str, action: str):
    entry = AgentLog(issue_id=issue_id, agent_name=agent_name, action=action)
    db.add(entry)
    db.commit()


def run_report_pipeline(db: Session, issue: Issue) -> Ticket:
    """
    Runs Triage -> Research -> Action for a freshly created citizen-reported
    Issue, persisting each step. This is the MVP loop: report -> ticket.
    Tracking/Escalation run separately (see tracking_agent / escalation_agent).
    """
    # 1. Triage
    triage_result = triage_agent.run(issue.description, urgency_hint=None)
    issue.category = triage_result["category"]
    issue.severity = Severity(triage_result["severity"])
    db.commit()
    _log(db, issue.id, "Triage Agent", triage_result["log"])

    return _run_research_and_action(db, issue)


def run_sensor_pipeline(db: Session, issue: Issue) -> Ticket:
    """
    Runs Research -> Action for an IoT-sensor-originated Issue. Skips the
    Triage Agent entirely - issue.category/severity are already set by
    app/agents/sensor_agent.py's deterministic threshold rules before this
    is called, not by LLM classification of free text (there's no citizen
    description to classify - just a sensor reading past a threshold).
    """
    _log(db, issue.id, "Triage Agent",
         f"Auto-classified from sensor telemetry (bypassed LLM/keyword classification - "
         f"deterministic threshold rule). Category: {issue.category.replace('_', ' ')}. "
         f"Severity: {issue.severity.value if hasattr(issue.severity, 'value') else issue.severity}.")

    return _run_research_and_action(db, issue)


def _run_research_and_action(db: Session, issue: Issue) -> Ticket:
    """Shared by both pipelines - everything after category/severity are known."""
    severity_str = issue.severity.value if hasattr(issue.severity, "value") else issue.severity

    # Assign to a persisted community cluster now that category/severity/location
    # are known - incremental, not a full recompute (see clustering.py).
    clustering.assign_to_cluster(db, issue)

    # 2. Research
    research_result = research_agent.run(issue.category, severity_str)
    _log(db, issue.id, "Research Agent", research_result["log"])

    # 3. Action
    action_result = action_agent.run(
        issue.description, issue.category, severity_str,
        latitude=issue.latitude, longitude=issue.longitude,
    )
    _log(db, issue.id, "Action Agent", action_result["log"])

    sla_deadline = datetime.utcnow() + timedelta(hours=research_result["sla_hours"])

    ticket = Ticket(
        issue_id=issue.id,
        authority=research_result["authority"],
        complaint_text=action_result["complaint_text"],
        external_ticket_id=action_result["external_ticket_id"],
        status=TicketStatus.WAITING_FOR_AUTHORITY,
        sla_deadline=sla_deadline,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    _log(db, issue.id, "Tracking Agent", "Monitoring schedule created. Case awaiting authority response.")

    return ticket
