#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 SZL Holdings
"""IMMUNE Lattice COP hologram — Channel B decision cell.

Stdlib HTTP on 7860. No npm. No Gradio. The LLM never holds this key.
Doctrine v11. Λ = Conjecture 1. Defense only.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HTML = Path(__file__).with_name("index.html")
GENESIS = "0" * 64
IGNORE = {"TGI", "Aphrodite", "LM Studio"}
WRAP = {"OpenAI / Anthropic / xAI", "Groq / Cerebras / SambaNova", "HF Inference Providers"}
WATCH = {"NVIDIA Dynamo", "llm-d"}

_lock = threading.Lock()
_chain: list[dict] = []


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def dump(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def mint(action: str, decision: str, payload: object) -> dict:
    with _lock:
        prev = _chain[-1]["hash"] if _chain else GENESIS
        body = {
            "id": str(uuid.uuid4()),
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "organ": "immune-lattice",
            "channel": "B",
            "action": action,
            "decision": decision,
            "lambda": "Conjecture 1",
            "evidence_class": "MEASURED",
            "prev_hash": prev,
            "payload": payload,
            "signer": "UNSIGNED-honest",
            "doctrine": "v11",
        }
        body["hash"] = sha256(dump({k: v for k, v in body.items() if k != "hash"}))
        _chain.append(body)
        return body


def bind(engine: str, verb: str) -> dict:
    engine = (engine or "").strip()[:80]
    verb = (verb or "").upper()
    if not engine:
        rec = mint("bind", "BLOCKED", {"reason": "engine required"})
        return {"ok": False, "decision": "BLOCKED", "reason": "engine required", "receipt": rec}
    if engine in IGNORE or verb == "IGNORE":
        rec = mint("bind", "BLOCKED", {"engine": engine, "verb": "IGNORE", "gap": "echo.receipt"})
        return {
            "ok": False,
            "decision": "BLOCKED",
            "reason": f"IGNORE {engine} — Channel B will not bind archived, copyleft, or closed toys",
            "receipt": rec,
        }
    if engine in WRAP or verb == "WRAP":
        rec = mint("wrap", "ALLOW", {"engine": engine, "verb": "WRAP", "weights": "opaque", "gap": "echo.receipt"})
        return {
            "ok": True,
            "decision": "WRAP",
            "reason": f"WRAP {engine} — opaque weights, foreign compute, receipt stamped",
            "receipt": rec,
        }
    if engine in WATCH or verb == "WATCH":
        rec = mint("watch", "ALLOW", {"engine": engine, "verb": "WATCH", "slo": False, "gap": "echo.receipt"})
        return {
            "ok": True,
            "decision": "WATCH",
            "reason": f"WATCH {engine} — stub, no SLO, no effector key",
            "receipt": rec,
        }
    rec = mint("bind", "ALLOW", {"engine": engine, "verb": "BIND", "gap": "echo.receipt"})
    return {
        "ok": True,
        "decision": "BIND",
        "reason": f"BIND {engine} — Channel B minted ECHO.RECEIPT.INFERENCE",
        "receipt": rec,
    }


def canary(cid: str) -> dict:
    cid = (cid or "").strip()[:80] or "unknown"
    rec = mint("canary", "HUNT", {"canary": cid, "gap": "ghost.lattice", "severity": "P1"})
    return {
        "ok": True,
        "decision": "HUNT",
        "reason": f"CANARY TRIP {cid} — decoy touched, real estate not shared",
        "receipt": rec,
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        return

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code: int, obj: object) -> None:
        self._send(code, json.dumps(obj).encode(), "application/json")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            body = HTML.read_bytes() if HTML.exists() else b"<h1>IMMUNE Lattice</h1>"
            self._send(200, body, "text/html; charset=utf-8")
            return
        if path in ("/health", "/healthz"):
            with _lock:
                n = len(_chain)
            self._json(200, {"ok": True, "organ": "immune-lattice", "yawar": n, "lambda": "Conjecture 1"})
            return
        if path == "/api/chain":
            with _lock:
                items = list(_chain[-24:])
            self._json(200, {"ok": True, "count": len(_chain), "items": items})
            return
        self._send(404, b"not found", "text/plain")

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            data = json.loads(raw.decode())
        except Exception:
            data = {}
        if path == "/api/bind":
            self._json(200, bind(str(data.get("engine") or ""), str(data.get("verb") or "BIND")))
            return
        if path == "/api/canary":
            self._json(200, canary(str(data.get("id") or "")))
            return
        self._send(404, b"not found", "text/plain")


def main() -> None:
    mint("genesis", "ALLOW", {"intent": "YAWAR chain sealed · Channel B online"})
    port = int(os.environ.get("PORT", "7860"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"immune-lattice Channel B listening 0.0.0.0:{port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
