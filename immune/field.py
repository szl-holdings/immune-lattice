"""Field cells compiled from public Ukraine COP doctrine.

Map-first. Cloud-exile. Dissimilar path. Cell isolation.
Independently implemented. Never a kill chain. Never people.
"""

from __future__ import annotations

from typing import Any

CELLS: list[dict[str, str]] = [
    {
        "id": "exile",
        "name": "RANGE.CLOUD.EXILE",
        "verb": "EXILE",
        "take": "Ukraine hosted Delta cloud abroad (Feb 2023) so missiles and wipers cannot kill the COP.",
        "tweak": "Channel B and YAWAR live off-estate. GitHub is source of truth. One blast does not unwind receipts.",
        "intent": "EXILE Channel B and YAWAR off-estate — blast radius cannot kill the chain",
    },
    {
        "id": "mesh",
        "name": "RANGE.FALLBACK.MESH",
        "verb": "MESH",
        "take": "Starlink kept Delta alive when fiber and towers died. Dissimilar path, not a vendor lock.",
        "tweak": "Two transports or SENTRA fails closed. We do not vendor a constellation. A single hose is a halt.",
        "intent": "MESH dissimilar transport or fail-closed — no single hose",
    },
    {
        "id": "quorum",
        "name": "CERT.CELL.QUORUM",
        "verb": "ISOLATE",
        "take": "CERT-UA plus private sector plus volunteers under fire. Decentralized C2 survived central jamming.",
        "tweak": "A cell isolates without collapsing the mesh. Volunteer fabric is HUNT only. No DDoS. No people.",
        "intent": "ISOLATE one cell — mesh holds — volunteer hunt is hunt-only",
    },
    {
        "id": "delta",
        "name": "FIELD.LATTICE.DELTA",
        "verb": "COMPILE",
        "take": "Delta: bottom-up map (Aerorozvidka 2016 → MoD 2023), sensors as objects, NATO CWIX, 160-requirement cyber assessment.",
        "tweak": "Objects are Spaces, receipts, kernels. Effectors isolate objects. Kill-zone language is SENTRA-blocked.",
        "intent": "COMPILE map-first COP of objects not people — Channel B is the only mutate",
    },
]

HUNTS: list[dict[str, str]] = [
    {
        "id": "G0034",
        "cluster": "Sandworm · APT44",
        "aliases": "ELECTRUM · Telebots · Voodoo Bear · Seashell Blizzard",
        "campaign": "C0028 / C0025 / C0034 Ukraine electric power",
        "hunt": "caddywiper_mass_delete · industroyer_iec104_unauth · scada_iso_autorun",
        "note": "Public CERT-UA / ESET / Mandiant. Hunt OT twins on RANGE. Never a live substation.",
        "intent": "HUNT G0034 Sandworm signatures on RANGE twin only — never people, never a live grid",
    },
    {
        "id": "G0007-C0051",
        "cluster": "APT28 Nearest Neighbor",
        "aliases": "Fancy Bear · Forest Blizzard",
        "campaign": "C0051 dual-homed Wi-Fi adjacency (2022–2024)",
        "hunt": "dual_homed_wifi_adjacency · lolbin_proc_creation",
        "note": "Public MITRE campaign. Isolate the dual-home, do not hunt the person.",
        "intent": "HUNT APT28 Nearest Neighbor dual-homed Wi-Fi adjacency — isolate the dual-home, never the person",
    },
    {
        "id": "UAC-WINRAR",
        "cluster": "WinRAR CVE-2025-8088",
        "aliases": "Russia-aligned archive lures vs Ukrainian orgs",
        "campaign": "Old CVE still live a year later (Trend Micro 2026)",
        "hunt": "winrar_cve_2025_8088 · archive_lure_macro",
        "note": "Patch/isolate the archive path. Do not open the lure to see.",
        "intent": "HUNT WinRAR CVE-2025-8088 archive lures — isolate the archive path, do not execute",
    },
]


def catalog() -> dict[str, Any]:
    return {
        "doctrine": "v11 LOCKED",
        "lambda_status": "Conjecture 1",
        "actuation": "SIMULATED",
        "rule": "hunt isolate deceive — never strike people",
        "cells": CELLS,
        "hunts": HUNTS,
    }


def lookup_cell(cid: str) -> dict[str, str] | None:
    return next((c for c in CELLS if c["id"] == cid or c["name"] == cid), None)


def lookup_hunt(hid: str) -> dict[str, str] | None:
    return next((h for h in HUNTS if h["id"] == hid or h["cluster"] == hid), None)
