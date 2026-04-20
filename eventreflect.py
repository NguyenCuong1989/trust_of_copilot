"""eventreflect loop bootstrap for trust_of_copilot."""

import json
import time
from datetime import datetime, timezone
from pathlib import Path

SYSTEM_LOGS_DIR = Path("SYSTEM_LOGS")
EVENTREFLECT_LOG = SYSTEM_LOGS_DIR / "eventreflect.log.jsonl"


def record_eventreflect(status: str, details: dict | None = None) -> None:
    SYSTEM_LOGS_DIR.mkdir(parents=True, exist_ok=True)
    entry = {
        "event_id": "evt_eventreflect_bootstrap",
        "type": "eventreflect",
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": details or {},
    }
    with EVENTREFLECT_LOG.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "
")


def eventreflect_loop(poll_seconds: int = 60) -> None:
    record_eventreflect("initialized", {"poll_seconds": poll_seconds, "mode": "bootstrap"})
    while True:
        record_eventreflect("polling")
        time.sleep(poll_seconds)


if __name__ == "__main__":
    eventreflect_loop()
