"""
Research Agent: works out which department is responsible and what SLA
applies.

Primary path: a real strands.Agent given a `lookup_department_sla` tool
bound to app/agents/sla_data.py. The agent calls the tool itself and reasons
about the result (e.g. tightening the SLA for emergency severity) - this is
genuine agentic tool use, not the LLM inventing a department name from
nothing.

Fallback path (no AWS creds): calls the same lookup function directly.
Both paths read from the same sla_data.py, so Gagan's research data is
used identically either way.
"""
import logging
from typing import Literal
from pydantic import BaseModel

from app.agents.strands_client import strands_available, get_strands_agent
from app.agents.sla_data import DEPARTMENT_SLA, EMERGENCY_SLA_HOURS

logger = logging.getLogger("civicrelay.research")

SYSTEM_PROMPT = (
    "You are the Research Agent for CivicRelay. Given a civic issue category "
    "and severity, call the lookup_department_sla tool to find the "
    "responsible authority and standard SLA. If severity is 'emergency', "
    "override the SLA hours to the emergency value the tool returns instead "
    "of the standard one. Return the final authority name and SLA in hours."
)


def _lookup(category: str, severity: str) -> dict:
    entry = DEPARTMENT_SLA.get(category, DEPARTMENT_SLA["other"])
    sla_hours = EMERGENCY_SLA_HOURS if severity == "emergency" else entry["sla_hours"]
    return {"authority": entry["authority"], "sla_hours": sla_hours}


class ResearchResult(BaseModel):
    authority: str
    sla_hours: int


def run(category: str, severity: str) -> dict:
    authority, sla_hours, source = None, None, "fallback"

    if strands_available():
        try:
            from strands import tool

            @tool
            def lookup_department_sla(issue_category: str, issue_severity: str) -> dict:
                """Looks up the responsible department and SLA hours for a civic issue category and severity.

                Args:
                    issue_category: One of road_infrastructure, waste_management, water_authority,
                        electrical_infrastructure, or other.
                    issue_severity: One of low, normal, high, or emergency.
                """
                return _lookup(issue_category, issue_severity)

            agent = get_strands_agent(SYSTEM_PROMPT, tools=[lookup_department_sla])
            result: ResearchResult = agent.structured_output(
                ResearchResult, f"category={category}, severity={severity}"
            )
            authority, sla_hours = result.authority, result.sla_hours
            source = "strands"
        except Exception as exc:
            logger.warning("Research Agent: Strands call failed, falling back to direct lookup: %s", exc)

    if authority is None:
        looked_up = _lookup(category, severity)
        authority, sla_hours = looked_up["authority"], looked_up["sla_hours"]

    return {
        "authority": authority,
        "sla_hours": sla_hours,
        "log": f"Identified {authority}. Expected response: {sla_hours}h. ({source})",
    }
