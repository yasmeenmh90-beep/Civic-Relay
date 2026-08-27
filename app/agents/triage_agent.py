"""
Triage Agent: reads the citizen's raw report and determines category + severity.

Primary path: a real strands.Agent on Bedrock, using structured_output to
force a validated {category, severity} response - genuine LLM reasoning,
not a keyword match dressed up as one.

Fallback path (no AWS creds configured, or the Bedrock call errors/throttles
mid-demo): a fast keyword classifier. This keeps local development and live
demos resilient - it's a deliberate fallback, not the "real" path.
"""
import logging
from typing import Literal
from pydantic import BaseModel

from app.agents.strands_client import strands_available, get_strands_agent

logger = logging.getLogger("civicrelay.triage")

Category = Literal["road_infrastructure", "waste_management", "water_authority", "electrical_infrastructure", "other"]
SeverityLevel = Literal["low", "normal", "high", "emergency"]


class TriageResult(BaseModel):
    category: Category
    severity: SeverityLevel


SYSTEM_PROMPT = (
    "You are the Triage Agent for CivicRelay, a civic issue reporting system. "
    "Given a citizen's report of a civic problem, classify it into exactly one "
    "category: road_infrastructure, waste_management, water_authority, "
    "electrical_infrastructure, or other - and a severity: low, normal, high, "
    "or emergency. Severity should be 'emergency' only for immediate "
    "life-safety risk, 'high' for issues causing real danger or major "
    "disruption, 'normal' for standard maintenance issues, and 'low' for "
    "minor cosmetic issues. Base your classification only on what the "
    "citizen actually described. The report may be in any language - "
    "understand it in its original language rather than requiring it to be "
    "in English."
)

# --- Fallback classifier (used when Strands/Bedrock isn't available) ---

CATEGORY_KEYWORDS = {
    "electrical_infrastructure": ["streetlight", "street light", "power line", "electric", "wire"],
    "water_authority": ["water leak", "sewage", "flooding", "burst pipe", "leaking pipe"],
    "waste_management": ["garbage", "trash", "waste", "litter", "dump"],
    "road_infrastructure": ["pothole", "pavement", "sidewalk", "road", "crack", "hole"],
}
HIGH_SEVERITY_WORDS = ["dangerous", "urgent", "injury", "accident", "collapsed", "fire"]
EMERGENCY_WORDS = ["emergency", "life-threatening", "explosion", "gas leak"]


def _keyword_classify(text: str):
    text_lower = text.lower()
    category = "other"
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            category = cat
            break

    severity = "normal"
    if any(w in text_lower for w in EMERGENCY_WORDS):
        severity = "emergency"
    elif any(w in text_lower for w in HIGH_SEVERITY_WORDS):
        severity = "high"

    return category, severity


def run(description: str, urgency_hint: str | None = None) -> dict:
    category, severity, source = None, None, "fallback"

    if strands_available():
        try:
            agent = get_strands_agent(SYSTEM_PROMPT)
            result: TriageResult = agent.structured_output(TriageResult, description)
            category, severity = result.category, result.severity
            source = "strands"
        except Exception as exc:  # Bedrock throttling/auth/network - never crash the report flow
            logger.warning("Triage Agent: Strands call failed, falling back to keyword classifier: %s", exc)

    if category is None:
        category, severity = _keyword_classify(description)

    # User-selected urgency can bump severity up, never down (safety-first).
    severity_rank = {"low": 0, "normal": 1, "high": 2, "emergency": 3}
    if urgency_hint and urgency_hint.lower() in severity_rank:
        if severity_rank[urgency_hint.lower()] > severity_rank[severity]:
            severity = urgency_hint.lower()

    return {
        "category": category,
        "severity": severity,
        "log": f"Classified issue as {category.replace('_', ' ')}. Severity: {severity}. ({source})",
    }
