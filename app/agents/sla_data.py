"""
Category -> responsible authority + expected SLA (in hours).

This is the Research Agent's lookup base. Gagan: fill in real department
names/SLAs per category (and split further by severity if useful) - the
Research Agent just reads from this dict, no code changes needed.
"""

DEPARTMENT_SLA = {
    "road_infrastructure": {
        "authority": "Municipal Roads Department",
        "sla_hours": 72,
    },
    "waste_management": {
        "authority": "Waste Management Department",
        "sla_hours": 48,
    },
    "water_authority": {
        "authority": "Water Infrastructure Department",
        "sla_hours": 24,
    },
    "electrical_infrastructure": {
        "authority": "Municipal Lighting Department",
        "sla_hours": 48,
    },
    "other": {
        "authority": "General Municipal Services",
        "sla_hours": 96,
    },
}

# Emergency-severity issues get a tighter SLA regardless of category.
EMERGENCY_SLA_HOURS = 4
