"""
Sensor Agent: evaluates raw IoT telemetry against known thresholds per
sensor type and decides whether it represents a genuine civic issue.

Deliberately NOT an LLM/Strands agent, unlike every other agent in this
app - a water pressure reading of 12 psi against a 20 psi threshold is a
deterministic fact, not something that benefits from language-model
judgment. The Triage Agent's job (classify ambiguous free text) doesn't
apply here; this is the sensor equivalent - immediate, rule-based,
auditable.
"""
from typing import Optional
from pydantic import BaseModel


class SensorEvaluation(BaseModel):
    category: str
    severity: str
    description: str


def _pothole_depth(value: float) -> Optional[SensorEvaluation]:
    if value < 5:
        return None  # shallow enough not to warrant a report
    severity = "emergency" if value >= 15 else "high" if value >= 10 else "normal"
    return SensorEvaluation(
        category="road_infrastructure",
        severity=severity,
        description=f"Road sensor detected a pothole approximately {value:.0f}cm deep.",
    )


def _streetlight_power_draw(value: float) -> Optional[SensorEvaluation]:
    if value > 0:
        return None  # drawing power normally - light is on
    return SensorEvaluation(
        category="electrical_infrastructure",
        severity="high",  # a dark streetlight at night is a real safety issue
        description="Streetlight sensor detected zero power draw during scheduled operating hours (bulb or fixture likely failed).",
    )


def _water_pipe_pressure(value: float) -> Optional[SensorEvaluation]:
    if value >= 20:
        return None  # normal operating pressure
    severity = "emergency" if value < 5 else "high"
    return SensorEvaluation(
        category="water_authority",
        severity=severity,
        description=f"Water pressure sensor detected an abnormal drop to {value:.1f} psi, indicating a likely leak or main break.",
    )


def _waste_bin_fill(value: float) -> Optional[SensorEvaluation]:
    if value < 90:
        return None
    severity = "high" if value >= 100 else "normal"
    return SensorEvaluation(
        category="waste_management",
        severity=severity,
        description=f"Waste bin fill sensor reports {value:.0f}% capacity - collection needed.",
    )


# sensor_type -> evaluator function. Extend this to add new sensor types -
# each function takes the raw numeric value and returns a SensorEvaluation
# if it crosses a threshold worth reporting, or None for a normal reading.
SENSOR_TYPE_RULES = {
    "pothole_depth_cm": _pothole_depth,
    "streetlight_power_draw_watts": _streetlight_power_draw,
    "water_pipe_pressure_psi": _water_pipe_pressure,
    "waste_bin_fill_percent": _waste_bin_fill,
}

# The same thresholds the evaluators above use, exposed explicitly so
# app/agents/predictive_agent.py can extrapolate "when will this reading
# cross the threshold" without duplicating magic numbers. "direction" is
# which way a WORSENING reading moves - increasing (depth, fill level) or
# decreasing (power draw, pressure) toward the threshold.
SENSOR_TYPE_THRESHOLDS = {
    "pothole_depth_cm": {"threshold": 5.0, "direction": "increasing"},
    "streetlight_power_draw_watts": {"threshold": 0.0, "direction": "decreasing"},
    "water_pipe_pressure_psi": {"threshold": 20.0, "direction": "decreasing"},
    "waste_bin_fill_percent": {"threshold": 90.0, "direction": "increasing"},
}

# category each sensor_type maps to - matches what the evaluators above
# return, exposed separately so predictive_agent doesn't need to call
# evaluate_telemetry with a fake value just to learn the category.
SENSOR_TYPE_CATEGORY = {
    "pothole_depth_cm": "road_infrastructure",
    "streetlight_power_draw_watts": "electrical_infrastructure",
    "water_pipe_pressure_psi": "water_authority",
    "waste_bin_fill_percent": "waste_management",
}


def evaluate_telemetry(sensor_type: str, value: float) -> Optional[SensorEvaluation]:
    """Returns a SensorEvaluation if this reading indicates a genuine issue,
    or None for a normal/unremarkable reading. Raises KeyError for an
    unregistered sensor_type - callers should validate against
    SENSOR_TYPE_RULES.keys() before calling."""
    evaluator = SENSOR_TYPE_RULES[sensor_type]
    return evaluator(value)
