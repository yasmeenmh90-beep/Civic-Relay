"""
Community issue clustering: groups reports of the same category that are
close together geographically into a single "community issue" - e.g. three
separate pothole reports on the same street become one cluster instead of
three unrelated cases.

Persisted and updated incrementally (one row per cluster in issue_clusters,
each issue points at its cluster via Issue.cluster_id) - assign_to_cluster()
runs once when a new issue is reported, comparing it only against existing
clusters in its own category (typically a handful of rows) rather than
recomputing every cluster from scratch against every issue on every read.
GET /issues/clusters is then a plain, cheap query instead of an O(n^2) sweep.
"""
import math
from sqlalchemy.orm import Session

from app.models import Issue, IssueCluster

CLUSTER_RADIUS_METERS = 300  # reports within this distance of each other cluster together

SEVERITY_RANK = {"low": 0, "normal": 1, "high": 2, "emergency": 3}


def _haversine_meters(lat1, lon1, lat2, lon2) -> float:
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _severity_value(severity) -> str:
    return severity.value if hasattr(severity, "value") else severity


def assign_to_cluster(db: Session, issue: Issue) -> IssueCluster | None:
    """
    Called once, right after Triage sets an issue's category/severity, with
    lat/lng already present. Attaches the issue to an existing nearby
    same-category cluster (updating its centroid, count, severity, and
    latest_reported), or creates a new one-member cluster. Returns None if
    the issue has no coordinates - clustering needs a location.
    """
    if issue.latitude is None or issue.longitude is None or not issue.category:
        return None

    severity = _severity_value(issue.severity)

    # Only compare against clusters already in this category - the whole
    # point of persisting is to avoid touching unrelated issues/clusters.
    candidates = db.query(IssueCluster).filter(IssueCluster.category == issue.category).all()

    for cluster in candidates:
        distance = _haversine_meters(cluster.center_lat, cluster.center_lng, issue.latitude, issue.longitude)
        if distance <= CLUSTER_RADIUS_METERS:
            n = cluster.report_count
            cluster.center_lat = (cluster.center_lat * n + issue.latitude) / (n + 1)
            cluster.center_lng = (cluster.center_lng * n + issue.longitude) / (n + 1)
            cluster.report_count = n + 1
            cluster.latest_reported = issue.created_at
            if SEVERITY_RANK.get(severity, 0) > SEVERITY_RANK.get(cluster.severity, 0):
                cluster.severity = severity
            issue.cluster_id = cluster.id
            db.commit()
            return cluster

    # No nearby cluster in this category - start a new one.
    cluster = IssueCluster(
        category=issue.category,
        center_lat=issue.latitude,
        center_lng=issue.longitude,
        report_count=1,
        severity=severity,
        first_reported=issue.created_at,
        latest_reported=issue.created_at,
    )
    db.add(cluster)
    db.commit()
    db.refresh(cluster)
    issue.cluster_id = cluster.id
    db.commit()
    return cluster


def list_clusters(db: Session) -> list[dict]:
    """Public read - only surfaces genuine clusters (2+ reports), same as before."""
    clusters = db.query(IssueCluster).filter(IssueCluster.report_count >= 2).all()

    result = []
    for cluster in clusters:
        issue_ids = [i.id for i in db.query(Issue.id).filter(Issue.cluster_id == cluster.id).all()]
        result.append({
            "category": cluster.category,
            "center_lat": round(cluster.center_lat, 6),
            "center_lng": round(cluster.center_lng, 6),
            "report_count": cluster.report_count,
            "severity": cluster.severity,
            "first_reported": cluster.first_reported,
            "latest_reported": cluster.latest_reported,
            "issue_ids": issue_ids,
        })
    return result
