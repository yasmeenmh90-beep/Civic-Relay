from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Issue, User
from app.schemas import IssueCreate, IssueOut, IssueClusterOut
from app.agents.orchestrator import run_report_pipeline
from app.agents import clustering as clustering_module
from app.deps import get_current_user
from app.rate_limit import limiter

router = APIRouter(prefix="/issues", tags=["issues"])


@router.post("", response_model=IssueOut)
@limiter.limit("10/minute")  # protects against spam-clicking or a runaway frontend retry loop
def report_issue(
    request: Request,
    payload: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = Issue(
        user_id=current_user.id,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        image_url=payload.image_url,
        language=payload.language,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    run_report_pipeline(db, issue)
    db.refresh(issue)
    return issue


@router.get("", response_model=list[IssueOut])
def list_issues(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's own issues (their 'My Civic Issues' dashboard)."""
    return (
        db.query(Issue)
        .filter(Issue.user_id == current_user.id)
        .order_by(Issue.created_at.desc())
        .all()
    )


@router.get("/clusters", response_model=list[IssueClusterOut])
def list_clusters(db: Session = Depends(get_db)):
    """Groups nearby same-category reports into community issues (e.g. 3 pothole
    reports on the same street become one cluster). Public - powers the community
    map view across all citizens' reports, and exposes no personal data beyond
    issue ids. Reads persisted clusters (updated incrementally as issues are
    reported, see app/agents/clustering.py) rather than recomputing on every
    request. Must be declared before /{issue_id} so 'clusters' isn't swallowed
    as a path parameter."""
    return clustering_module.list_clusters(db)


@router.get("/{issue_id}", response_model=IssueOut)
def get_issue(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if issue.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your issue")
    return issue
