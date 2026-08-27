"""
Simulates a small fleet of IoT sensors reporting telemetry to CivicRelay's
ingestion endpoint. There is no real civic-infrastructure sensor network
for this project to connect to - this script exists to demonstrate the
real ingestion pipeline (app/routers/iot.py, app/agents/sensor_agent.py)
with realistic-shaped data, standing in for hardware that doesn't exist
for a hackathon project.

Run: python scripts/simulate_iot_sensors.py
Requires the server running and IOT_INGEST_API_KEY set to the same value
on both the server and this script (via env var or the constant below).

Each simulated sensor drifts within a normal range most of the time, and
occasionally crosses its threshold to demonstrate auto-detection -
watch the server logs or query GET /issues to see issues appear without
any human reporting them.
"""
import os
import random
import time
import requests

BASE_URL = os.getenv("CIVICRELAY_BASE_URL", "http://localhost:8000")
API_KEY = os.getenv("IOT_INGEST_API_KEY", "")

SENSORS = [
    {"sensor_id": "SENSOR-ROAD-0042", "sensor_type": "pothole_depth_cm", "latitude": 12.9716, "longitude": 77.5946, "normal_range": (0, 3), "spike_range": (8, 18)},
    {"sensor_id": "SENSOR-LIGHT-0117", "sensor_type": "streetlight_power_draw_watts", "latitude": 12.9720, "longitude": 77.5950, "normal_range": (40, 60), "spike_range": (0, 0)},
    {"sensor_id": "SENSOR-WATER-0033", "sensor_type": "water_pipe_pressure_psi", "latitude": 12.9701, "longitude": 77.5930, "normal_range": (25, 35), "spike_range": (1, 8)},
    {"sensor_id": "SENSOR-BIN-0201", "sensor_type": "waste_bin_fill_percent", "latitude": 12.9730, "longitude": 77.5960, "normal_range": (10, 70), "spike_range": (92, 100)},
]

SPIKE_PROBABILITY = 0.15  # how often a sensor reports an anomalous reading, per tick


def send_telemetry(sensor: dict, value: float):
    headers = {"X-IoT-Api-Key": API_KEY}
    payload = {
        "sensor_id": sensor["sensor_id"],
        "sensor_type": sensor["sensor_type"],
        "value": value,
        "latitude": sensor["latitude"],
        "longitude": sensor["longitude"],
    }
    try:
        resp = requests.post(f"{BASE_URL}/iot/telemetry", json=payload, headers=headers, timeout=10)
        print(f"[{sensor['sensor_id']}] value={value:.1f} -> {resp.status_code} {resp.json()}")
    except requests.RequestException as exc:
        print(f"[{sensor['sensor_id']}] failed to send telemetry: {exc}")


def run(interval_seconds: int = 5, ticks: int = 20):
    if not API_KEY:
        print("IOT_INGEST_API_KEY is not set - the server will reject every request. "
              "Set it to the same value as the server's IOT_INGEST_API_KEY env var.")
        return

    for _ in range(ticks):
        for sensor in SENSORS:
            if random.random() < SPIKE_PROBABILITY:
                low, high = sensor["spike_range"]
            else:
                low, high = sensor["normal_range"]
            value = random.uniform(low, high) if high > low else float(low)
            send_telemetry(sensor, value)
        time.sleep(interval_seconds)


if __name__ == "__main__":
    run()
