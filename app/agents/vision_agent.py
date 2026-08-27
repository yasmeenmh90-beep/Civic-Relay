"""
Vision Agent: looks at an uploaded issue photo and confirms/refines the
category and severity a citizen (or the Triage Agent) reported - e.g.
confirming "large pothole, high severity" directly from the image, not just
the text description.

Requires a vision-capable Bedrock model (Claude 3.5+ models support this).
If Strands/Bedrock isn't configured, analysis is skipped entirely - image
upload still works, it just won't include a vision_analysis field. There's
no offline fallback here (unlike the text agents) because there's no
meaningful non-LLM way to "analyze" an image.
"""
import logging
from typing import Literal, Optional
from pydantic import BaseModel

from app.agents.strands_client import strands_available, get_strands_agent

logger = logging.getLogger("civicrelay.vision")

SYSTEM_PROMPT = (
    "You are the Vision Agent for CivicRelay. Look at the photo of a civic "
    "issue (pothole, garbage, water leak, broken streetlight, or similar) "
    "and assess it. Confirm whether the photo shows a genuine civic "
    "infrastructure issue, describe what you see in one sentence, and "
    "assess severity as low, normal, high, or emergency based only on what "
    "is visibly damaged or dangerous in the image."
)

ContentTypeToFormat = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
}


class VisionResult(BaseModel):
    shows_genuine_issue: bool
    visible_description: str
    assessed_severity: Literal["low", "normal", "high", "emergency"]


def analyze_image(image_bytes: bytes, content_type: str) -> Optional[dict]:
    """Returns an analysis dict, or None if vision analysis isn't available/failed."""
    if not strands_available():
        return None

    image_format = ContentTypeToFormat.get(content_type)
    if not image_format:
        return None  # e.g. HEIC isn't a Bedrock-supported vision format

    try:
        agent = get_strands_agent(SYSTEM_PROMPT)
        content = [
            {"image": {"format": image_format, "source": {"bytes": image_bytes}}},
            {"text": "Assess this civic issue photo."},
        ]
        result: VisionResult = agent.structured_output(VisionResult, content)
        return {
            "shows_genuine_issue": result.shows_genuine_issue,
            "visible_description": result.visible_description,
            "assessed_severity": result.assessed_severity,
        }
    except Exception as exc:
        logger.warning("Vision Agent: analysis failed, skipping: %s", exc)
        return None
