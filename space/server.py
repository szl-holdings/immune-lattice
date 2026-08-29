"""IMMUNE Lattice COP — stdlib HTTP. Defense only. Port 7860."""
from __future__ import annotations

import hashlib
import json
import os
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HTML = Path(__file__).with_name("index.html")
GENESIS = "0" * 64
TRIPWIRES = (
    "weapon",
    "targeting",
    "effector",
    "strike",
    "kill-chain",
    "fire-for-effect",
    "kinetic",
)


def _sha256(payload: dict) -> str:
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(blob).hexdigest()


def sentra(signal: str) -> dict:
    text = (signal or "").strip().lower()
    hits = [t for t in TRIPWIRES if t in text]
    blocked = bool(hits) or not text
    body = {
        "id": str(uuid.uuid4()),
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "organ": "immune",
        "gate": "SENTRA",
        "decision": "BLOCKED" if blocked else "ALLOW",
        "hits": hits,
        "lambda_status": "Conjecture 1",
        "energy": None,
        "signer": "UNSIGNED-honest",
        "honesty": "STRUCTURAL-ONLY",
        "note": "Defense only. Hunt, isolate, deceive. Never strike people."
        if hits
        else ("Empty signal fails closed." if not text else "Admitted to RANGE observation."),
    }
    body["hash"] = _sha256(body)
    return body


def yawar(event: str, prev: str) -> dict:
    prev_h = prev if isinstance(prev, str) and len(prev) == 64 else GENESIS
    body = {
        "id": str(uuid.uuid4()),
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "organ": "immune",
        "action": "yawar-append",
        "event": (event or "")[:240],
        "prev_hash": prev_h,
        "lambda_status": "Conjecture 1",
        "energy": None,
        "signer": "UNSIGNED-honest",
        "honesty": "STRUCTURAL-ONLY",
        "channels": ["RANGE", "GHOST", "WRAITH", "ECHO"],
        "actuation": "SIMULATED",
    }
    body["hash"] = _sha256(body)
    return body


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

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            self._send(200, HTML.read_bytes(), "text/html; charset=utf-8")
            return
        if path in ("/health", "/healthz"):
            self._send(
                200,
                json.dumps(
                    {
                        "ok": True,
                        "service": "immune-lattice",
                        "lambda_status": "Conjecture 1",
                        "energy": None,
                        "actuation": "SIMULATED",
                    }
                ).encode(),
                "application/json",
            )
            return
        if path == "/api/honest":
            self._send(
                200,
                json.dumps(
                    {
                        "doctrine": "v11 LOCKED",
                        "lock": "749/14/163",
                        "lambda_status": "Conjecture 1",
                        "energy": None,
                        "signer": "UNSIGNED-honest",
                        "kernel": "https://huggingface.co/spaces/SZLHOLDINGS/immune",
                        "source": "https://github.com/szl-holdings/immune-lattice",
                        "wraith": "SIMULATED",
                        "echo": "SIMULATED",
                    }
                ).encode(),
                "application/json",
            )
            return
        self._send(404, b"not found", "text/plain")

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            data = json.loads(raw.decode() or "{}")
        except Exception:
            data = {}
        if path == "/api/sentra":
            rec = sentra(str(data.get("signal") or ""))
            self._send(200, json.dumps(rec).encode(), "application/json")
            return
        if path == "/api/yawar":
            rec = yawar(str(data.get("event") or "pulse"), str(data.get("prev_hash") or GENESIS))
            self._send(200, json.dumps(rec).encode(), "application/json")
            return
        self._send(404, b"not found", "text/plain")


def main() -> None:
    port = int(os.environ.get("PORT", "7860"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"immune-lattice listening 0.0.0.0:{port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
