"""Dome layers compiled from public Iron Dome / INCD doctrine.

Selective intercept. White-glove RANGE counter. Never people.
Independently implemented. Never a kill chain.
"""

from __future__ import annotations

from typing import Any

LAYERS: list[dict[str, str]] = [
    {
        "id": "radar",
        "name": "DOME.RADAR.TRACK",
        "analog": "EL/M-2084",
        "verb": "HUNT",
        "take": "Iron Dome radar detects launch and tracks trajectory. It does not fire yet.",
        "tweak": "Inbound objects are campaigns. Radar is HUNT. A track is not an intercept and not a person.",
        "intent": "HUNT inbound tracks on the lattice radar — detect only, never people",
    },
    {
        "id": "bmc",
        "name": "DOME.BMC.SELECT",
        "analog": "Iron Dome BMC",
        "verb": "ATTRIBUTE",
        "take": "Battle management fires Tamir only if the rocket will hit a defended area. Open field is let-fall.",
        "tweak": "Selectivity is the unoccupied intersection. Do not spend an interceptor on noise.",
        "intent": "ATTRIBUTE trajectory HIT vs MISS — intercept only defended estate, let open-field fall",
    },
    {
        "id": "tamir",
        "name": "DOME.TAMIR.INTERCEPT",
        "analog": "Tamir interceptor",
        "verb": "INTERCEPT",
        "take": "The interceptor kills the inbound munition, not the launcher crew. That is defense.",
        "tweak": "INTERCEPT the inbound object. White glove: operator click, SENTRA, YAWAR. No packets at the public internet.",
        "intent": "WHITEGLOVE INTERCEPT inbound object on RANGE — Tamir analog, defended estate only, never people",
    },
    {
        "id": "beam",
        "name": "DOME.BEAM.CHEAP",
        "analog": "Iron Beam",
        "verb": "TARPIT",
        "take": "Laser intercept is cheap electricity vs a Tamir. Complementary layer, not a replacement.",
        "tweak": "Low-sev inbound is TARPIT. Save INTERDICT for HIT tracks.",
        "intent": "TARPIT low-sev inbound — cheap intercept analog, RANGE only, never people",
    },
    {
        "id": "arrow",
        "name": "DOME.ARROW.COUNTER",
        "analog": "Arrow / counter-battery RANGE",
        "verb": "INTERDICT",
        "take": "Iron Dome does not bomb the launch site. Counter-battery is a different layer, still not people.",
        "tweak": "Hack-back is INTERDICT of the RANGE twin of attacker infra. Live third-party hosts stay fail-closed.",
        "intent": "WHITEGLOVE INTERDICT RANGE twin of attacker infrastructure after intercept — live internet fail-closed",
    },
]


def catalog() -> dict[str, Any]:
    return {
        "doctrine": "v11 LOCKED",
        "lambda_status": "Conjecture 1",
        "actuation": "SIMULATED",
        "rule": "hunt isolate deceive intercept — never strike people",
        "glove": "operator click + SENTRA + YAWAR + Channel B. LLM never holds the effector key.",
        "hack_back": "Private live hack-back is out of authority. After intercept, INTERDICT the RANGE twin.",
        "layers": LAYERS,
        "layer_count": len(LAYERS),
    }


def lookup_layer(layer_id: str) -> dict[str, str] | None:
    key = (layer_id or "").strip().lower()
    for layer in LAYERS:
        if layer["id"] == key or layer["name"].lower() == key:
            return layer
    return None
