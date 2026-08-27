"""
Municipal API integration via Open311 (GeoReport v2) - a real, standardized
API spec used by many actual cities for civic issue reporting (San
Francisco, Chicago, Washington DC, Toronto, Bloomington, and others).
Spec: https://wiki.open311.org/GeoReport_v2/

This is a genuine implementation of the spec's POST /requests.json call,
not a fake. What's still simulated is the endpoint itself: no single
"municipal API" exists to point at by default, because it's Open311's
whole design that every city runs its own endpoint at its own URL, often
behind its own API key. Configure MUNICIPAL_API_BASE_URL (+ optionally
MUNICIPAL_API_KEY) to point this at any real Open311-compliant city
endpoint - e.g. San Francisco's, or a SeeClickFix-hosted city.

Without that configured, ticket submission stays exactly as it was before:
a locally generated CIV-XXXX reference, no network call.
"""
import os
import logging
import requests

logger = logging.getLogger("civicrelay.municipal_api")

MUNICIPAL_API_BASE_URL = os.getenv("MUNICIPAL_API_BASE_URL", "").rstrip("/")
MUNICIPAL_API_KEY = os.getenv("MUNICIPAL_API_KEY", "")
MUNICIPAL_JURISDICTION_ID = os.getenv("MUNICIPAL_JURISDICTION_ID", "")  # only needed for multi-jurisdiction endpoints

# Open311 service_code is jurisdiction-specific (each city defines its own via
# GET /services.json) - there is no universal mapping. This is a placeholder
# that MUST be replaced with real codes fetched from the target city's own
# /services.json before this goes live against a real endpoint.
CATEGORY_TO_SERVICE_CODE = {
    "road_infrastructure": os.getenv("SERVICE_CODE_ROAD", "001"),
    "waste_management": os.getenv("SERVICE_CODE_WASTE", "002"),
    "water_authority": os.getenv("SERVICE_CODE_WATER", "003"),
    "electrical_infrastructure": os.getenv("SERVICE_CODE_ELECTRICAL", "004"),
    "other": os.getenv("SERVICE_CODE_OTHER", "000"),
}


def municipal_api_available() -> bool:
    return bool(MUNICIPAL_API_BASE_URL)


def submit_service_request(
    category: str,
    description: str,
    latitude: float | None,
    longitude: float | None,
) -> dict | None:
    """
    Submits a real Open311 service request. Returns
    {"service_request_id": "...", "service_notice": "..."} on success,
    or None if the municipal API isn't configured or the call fails -
    callers should fall back to a locally generated ticket reference either way.
    """
    if not municipal_api_available():
        return None

    payload = {
        "service_code": CATEGORY_TO_SERVICE_CODE.get(category, CATEGORY_TO_SERVICE_CODE["other"]),
        "description": description,
    }
    if MUNICIPAL_API_KEY:
        payload["api_key"] = MUNICIPAL_API_KEY
    if MUNICIPAL_JURISDICTION_ID:
        payload["jurisdiction_id"] = MUNICIPAL_JURISDICTION_ID
    if latitude is not None and longitude is not None:
        payload["lat"] = latitude
        payload["long"] = longitude

    try:
        response = requests.post(
            f"{MUNICIPAL_API_BASE_URL}/requests.json",
            data=payload,  # Open311 POST spec: application/x-www-form-urlencoded
            timeout=10,
        )
        response.raise_for_status()
        results = response.json()

        # Open311 returns a list of request objects (usually length 1)
        if isinstance(results, list) and results:
            first = results[0]
            if "service_request_id" in first:
                return {
                    "service_request_id": first["service_request_id"],
                    "service_notice": first.get("service_notice", ""),
                }
            if "token" in first:
                # Async jurisdictions return a token instead of an immediate id
                # (GET /tokens/{token}.json would resolve it later) - not
                # resolved here, but the token itself is still a real reference.
                return {"service_request_id": f"token:{first['token']}", "service_notice": ""}

        logger.warning("Municipal API: unexpected response shape: %s", results)
        return None

    except requests.RequestException as exc:
        logger.warning("Municipal API: submission failed, falling back to local ticket ref: %s", exc)
        return None
