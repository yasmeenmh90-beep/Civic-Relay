"""
Municipal analytics: city-side aggregation across ALL issues (not scoped to
one citizen), for staff to see trends, SLA compliance, and department load.

Unlike every other integration built this session, this needs no external
service or account - it's pure aggregation over data CivicRelay already has.
"""
from collections import defaultdict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models import Issue, Ticket, TicketStatus


def _severity_value(severity) -> str:
    return severity.value if hasattr(severity, "value") else (severity or "unknown")


def get_overview(db: Session) -> dict:
    issues = db.query(Issue).all()
    tickets = db.query(Ticket).all()

    total_issues = len(issues)
    resolved_tickets = [t for t in tickets if t.status == TicketStatus.RESOLVED]
    escalated_tickets = [t for t in tickets if t.status in (TicketStatus.AWAITING_APPROVAL, TicketStatus.ESCALATED)]
    open_tickets = [t for t in tickets if t.status != TicketStatus.RESOLVED]

    resolution_hours = [
        (t.resolved_at - t.submitted_at).total_seconds() / 3600
        for t in resolved_tickets
        if t.resolved_at and t.submitted_at
    ]
    avg_resolution_hours = round(sum(resolution_hours) / len(resolution_hours), 1) if resolution_hours else None

    on_time = [
        t for t in resolved_tickets
        if t.resolved_at and t.sla_deadline and t.resolved_at <= t.sla_deadline
    ]
    sla_compliance_rate = round(len(on_time) / len(resolved_tickets) * 100, 1) if resolved_tickets else None

    by_category = defaultdict(int)
    by_severity = defaultdict(int)
    by_source = defaultdict(int)
    for issue in issues:
        by_category[issue.category or "unclassified"] += 1
        by_severity[_severity_value(issue.severity)] += 1
        by_source[issue.source or "citizen_report"] += 1

    return {
        "total_issues": total_issues,
        "open_issues": len(open_tickets),
        "resolved_issues": len(resolved_tickets),
        "escalated_issues": len(escalated_tickets),
        "avg_resolution_hours": avg_resolution_hours,
        "sla_compliance_rate": sla_compliance_rate,
        "by_category": dict(by_category),
        "by_severity": dict(by_severity),
        "by_source": dict(by_source),
    }


def get_trends(db: Session, days: int = 30) -> list[dict]:
    """Daily issue-report counts for the last `days` days. Bucketed in
    Python rather than SQL date-truncation, since that syntax differs
    between SQLite and Postgres and this keeps it portable."""
    since = datetime.utcnow() - timedelta(days=days)
    issues = db.query(Issue.created_at).filter(Issue.created_at >= since).all()

    counts = defaultdict(int)
    for (created_at,) in issues:
        counts[created_at.date().isoformat()] += 1

    # Fill in zero-count days too, so the frontend gets a continuous series
    # instead of gaps it has to infer.
    result = []
    for i in range(days, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date().isoformat()
        result.append({"date": day, "count": counts.get(day, 0)})
    return result


def get_by_authority(db: Session) -> list[dict]:
    tickets = db.query(Ticket).filter(Ticket.authority.isnot(None)).all()

    grouped = defaultdict(list)
    for t in tickets:
        grouped[t.authority].append(t)

    result = []
    for authority, group in grouped.items():
        resolved = [t for t in group if t.status == TicketStatus.RESOLVED]
        resolution_hours = [
            (t.resolved_at - t.submitted_at).total_seconds() / 3600
            for t in resolved if t.resolved_at and t.submitted_at
        ]
        result.append({
            "authority": authority,
            "total": len(group),
            "open": len([t for t in group if t.status != TicketStatus.RESOLVED]),
            "resolved": len(resolved),
            "avg_resolution_hours": round(sum(resolution_hours) / len(resolution_hours), 1) if resolution_hours else None,
        })

    return sorted(result, key=lambda r: r["total"], reverse=True)


def get_map_points(db: Session) -> list[dict]:
    """Every issue with coordinates, unfiltered and ungrouped - the granular
    staff view. Contrast with the public GET /issues/clusters, which only
    surfaces grouped clusters of 2+ reports and no individual issue detail."""
    issues = (
        db.query(Issue)
        .filter(Issue.latitude.isnot(None), Issue.longitude.isnot(None))
        .all()
    )
    result = []
    for issue in issues:
        result.append({
            "id": issue.id,
            "category": issue.category,
            "severity": _severity_value(issue.severity),
            "latitude": issue.latitude,
            "longitude": issue.longitude,
            "status": issue.ticket.status if issue.ticket else None,
            "source": issue.source or "citizen_report",
            "created_at": issue.created_at,
        })
    return result
