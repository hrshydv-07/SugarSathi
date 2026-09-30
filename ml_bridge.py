#!/usr/bin/env python3
"""
ml_bridge.py — Smriti ML Engine Bridge
---------------------------------------
Utility module that provides a clean Python interface to the
Smriti Dementia AI Engine hosted on Render.

Endpoints exposed by the FastAPI ML microservice:
  POST /get_next_difficulty       → Adaptive game difficulty prediction
  POST /calculate_health_score    → Longitudinal cognitive health score (0-100)
  POST /speak_reminder            → Regional language TTS synthesis
  POST /synthesize_speech         → Bhashini speech pipeline

Usage (standalone test):
  python ml_bridge.py

Dependencies:
  pip install requests python-dotenv
"""

import os
import json
import time
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ─────────────────────────────────────────────────────────────

ML_ENGINE_BASE = os.getenv(
    "ML_SERVICE_URL",
    "https://dementia-ai-engine.onrender.com"
)
REQUEST_TIMEOUT = 12  # seconds


# ── HTTP helper ───────────────────────────────────────────────────────────────

def _post(endpoint: str, payload: dict) -> Optional[dict]:
    """Send a POST request to the ML engine and return parsed JSON."""
    url = f"{ML_ENGINE_BASE}{endpoint}"
    try:
        start = time.time()
        response = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT)
        elapsed = round((time.time() - start) * 1000)
        response.raise_for_status()
        print(f"[ML Bridge] {endpoint} → {response.status_code} ({elapsed}ms)")
        return response.json()
    except requests.exceptions.Timeout:
        print(f"[ML Bridge] ⚠️  Timeout after {REQUEST_TIMEOUT}s — {endpoint}")
        return None
    except requests.exceptions.ConnectionError:
        print(f"[ML Bridge] ❌ Connection error — ML engine may be cold-starting.")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"[ML Bridge] ❌ HTTP {e.response.status_code} — {endpoint}")
        return None


# ── Public API ────────────────────────────────────────────────────────────────

def get_next_difficulty(
    patient_id: int,
    game_type: str,
    recent_accuracy: float,
    recent_reaction_time: float,
    recent_mistakes: int,
    current_level: int = 1,
) -> Optional[dict]:
    """
    Predict the optimal starting difficulty for the next game session.

    Args:
        patient_id:           Numeric patient identifier.
        game_type:            e.g. 'market-day-basket'
        recent_accuracy:      Accuracy percentage (0–100) from last session.
        recent_reaction_time: Average reaction time in seconds.
        recent_mistakes:      Total mistakes in last session.
        current_level:        Current difficulty level (1–5).

    Returns:
        Dict with 'recommended_difficulty' and 'reasoning', or None on failure.
    """
    payload = {
        "patient_id":           patient_id,
        "game_type":            game_type,
        "recent_accuracy":      recent_accuracy,
        "recent_reaction_time": recent_reaction_time,
        "recent_mistakes":      recent_mistakes,
        "current_level":        current_level,
    }
    return _post("/get_next_difficulty", payload)


def calculate_health_score(
    patient_id: int,
    weekly_sessions: list,
) -> Optional[dict]:
    """
    Compute a longitudinal Cognitive Health Score (0–100) from weekly telemetry.

    Args:
        patient_id:      Numeric patient identifier.
        weekly_sessions: List of session dicts, each containing:
                         { accuracy, reaction_time, mistakes, game_type, timestamp }

    Returns:
        Dict with 'cognitive_health_score', 'status', and 'trend', or None.
    """
    payload = {
        "patient_id":      patient_id,
        "weekly_sessions": weekly_sessions,
    }
    return _post("/calculate_health_score", payload)


def synthesize_speech(
    text: str,
    language: str = "hi-IN",
) -> Optional[dict]:
    """
    Synthesize text-to-speech audio via the Bhashini pipeline.

    Args:
        text:     Input text to synthesize.
        language: BCP-47 language tag — 'hi-IN', 'as-IN', 'en-IN', etc.

    Returns:
        Dict with 'audio_base64' and 'mime_type', or None on failure.
    """
    payload = {"text": text, "language": language}
    return _post("/synthesize_speech", payload)


# ── Health check ──────────────────────────────────────────────────────────────

def ping_engine() -> bool:
    """Check if the ML engine is reachable (GET /docs returns 200)."""
    url = f"{ML_ENGINE_BASE}/docs"
    try:
        r = requests.get(url, timeout=REQUEST_TIMEOUT)
        reachable = r.status_code == 200
        status = "✅ reachable" if reachable else f"⚠️  HTTP {r.status_code}"
        print(f"[ML Bridge] Engine ping → {status}")
        return reachable
    except Exception as e:
        print(f"[ML Bridge] ❌ Engine unreachable: {e}")
        return False


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("Smriti ML Engine Bridge — Connectivity Test")
    print(f"Target: {ML_ENGINE_BASE}")
    print("=" * 60)

    # 1. Ping
    alive = ping_engine()
    if not alive:
        print("\n⚠️  Engine is cold-starting (Render free tier). "
              "Wait ~30s and retry.\n")

    # 2. Adaptive difficulty
    print("\n[Test 1] get_next_difficulty")
    diff = get_next_difficulty(
        patient_id=1,
        game_type="market-day-basket",
        recent_accuracy=78.5,
        recent_reaction_time=12.3,
        recent_mistakes=1,
        current_level=2,
    )
    if diff:
        print(json.dumps(diff, indent=2))

    # 3. Health score
    print("\n[Test 2] calculate_health_score")
    sessions = [
        {"accuracy": 80, "reaction_time": 11.2, "mistakes": 1,
         "game_type": "odd-one-out", "timestamp": "2026-09-30T08:00:00Z"},
        {"accuracy": 75, "reaction_time": 13.5, "mistakes": 2,
         "game_type": "sound-rhythm-match", "timestamp": "2026-09-29T09:00:00Z"},
        {"accuracy": 82, "reaction_time": 10.8, "mistakes": 0,
         "game_type": "faces-family-recall", "timestamp": "2026-09-28T10:00:00Z"},
    ]
    score = calculate_health_score(patient_id=1, weekly_sessions=sessions)
    if score:
        print(json.dumps(score, indent=2))

    print("\n[ML Bridge] Test complete.")
