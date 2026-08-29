"""SENTRA admission gate. Matches src/lib/immune/sentra.ts."""

from __future__ import annotations

import re
from typing import Any

SIGNATURES: list[dict[str, Any]] = [
    {"name": "intent.required", "requireFields": ["intent", "actor"]},
    {
        "name": "no.exfil.tokens",
        "forbiddenSubstrings": ["BEGIN PRIVATE KEY", "AKIA", "sk-live-", "sk-prod-", "hf_pat_"],
    },
    {
        "name": "no.shell.escape",
        "forbiddenSubstrings": ["$(", "`rm -rf", "../../../", "curl | sh", "wget | bash"],
    },
    {
        "name": "no.unauthorized.strike",
        "forbiddenSubstrings": ["STRIKE LIVE", "STRIKE CISA", "kill-chain", "fire-for-effect"],
    },
    {
        "name": "no.hack.persons",
        "forbiddenSubstrings": ["hack people", "hack persons", "target civilians", "hack a person", "strike people"],
    },
]

# Hunt behaviors, not humans. Strike/kill/target near a person-word is fail-closed.
PERSON_TARGET = re.compile(
    r"\b(hack(ing)?|pwn|exploit|phish(ing)?|doxx?|swat(ting)?|strike|kill|weaponize|target)\b.{0,48}\b"
    r"(people|humans?|civilians?|personnel|employees?|students?|journalists?)\b",
    re.I,
)

MAX_DEPTH = 32
MAX_FIELD_LEN = 65_536


def list_sentra_signatures() -> list[dict[str, Any]]:
    return [dict(s) for s in SIGNATURES]


def sentra_inspect(raw_intent: Any, mode: str) -> dict[str, Any]:
    if mode == "SENTRA_REJECT":
        return {
            "accepted": False,
            "reason": "operator-forced reject (SENTRA_REJECT)",
            "signatureMatched": "operator.forced.reject",
        }
    if mode == "DEADMAN":
        return {
            "accepted": False,
            "reason": "DEADMAN freeze — all writes refused",
            "signatureMatched": "deadman.engaged",
        }
    try:
        payload = _normalize(raw_intent, 0)
    except Exception as err:
        return {
            "accepted": False,
            "reason": f"dos guard: {err}",
            "signatureMatched": "guard.dos",
        }

    import json

    haystack = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).lower()
    record = payload if isinstance(payload, dict) else {}

    for sig in SIGNATURES:
        for field in sig.get("requireFields") or []:
            if record.get(field) in (None, ""):
                return {
                    "accepted": False,
                    "reason": f"missing required field: {field}",
                    "signatureMatched": sig["name"],
                }
        for needle in sig.get("forbiddenSubstrings") or []:
            if needle.lower() in haystack:
                return {
                    "accepted": False,
                    "reason": f"forbidden token: {needle}",
                    "signatureMatched": sig["name"],
                }

    if PERSON_TARGET.search(haystack):
        return {
            "accepted": False,
            "reason": "no.hack.persons — IMMUNE will not target people, civilians, inboxes, or identities. Hunt RANGE infrastructure.",
            "signatureMatched": "no.hack.persons",
        }

    if re.search(r"hack\s*back|attack\s*back|retaliat", haystack) and "range" not in haystack:
        return {
            "accepted": False,
            "reason": "no.unauthorized.strike — live hack-back is out of authority. Intercept the inbound object. INTERDICT the RANGE twin.",
            "signatureMatched": "no.unauthorized.strike",
        }

    return {
        "accepted": True,
        "reason": "ok: matched intent.required and clean",
        "signatureMatched": "intent.required",
    }


def _normalize(value: Any, depth: int) -> Any:
    if depth > MAX_DEPTH:
        raise ValueError(f"depth>{MAX_DEPTH}")
    if value is None:
        return None
    if isinstance(value, str):
        if len(value) > MAX_FIELD_LEN:
            raise ValueError("field>64KiB")
        return value
    if isinstance(value, bool) or isinstance(value, (int, float)):
        return value
    if isinstance(value, list):
        return [_normalize(item, depth + 1) for item in value]
    if isinstance(value, dict):
        return {str(k): _normalize(value[k], depth + 1) for k in sorted(value.keys())}
    return None
