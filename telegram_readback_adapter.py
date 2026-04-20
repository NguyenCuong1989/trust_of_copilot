"""Cloud-Assisted Readback adapter for Telegram + Gemini Cloud Vision lane."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

GEMINI_PROJECT_ID = "gen-lang-client-0863690953"
CLOUD_VISION_LANE = "gemini"
SOVEREIGN_DISPATCH_CHANNEL = "telegram"


@dataclass(slots=True)
class ReadbackFrame:
    chat_id: str
    message_id: str
    prompt: str
    attachment_refs: list[str]


def build_readback_frame(chat_id: str, message_id: str, prompt: str, attachment_refs: list[str] | None = None) -> ReadbackFrame:
    """Normalize Telegram input before it is forwarded to the Gemini readback lane."""
    return ReadbackFrame(
        chat_id=chat_id,
        message_id=message_id,
        prompt=prompt,
        attachment_refs=attachment_refs or [],
    )


def build_gemini_payload(frame: ReadbackFrame) -> dict[str, Any]:
    """Prepare the Cloud Vision Lane payload shape without committing to transport details yet."""
    return {
        "project_id": GEMINI_PROJECT_ID,
        "lane": CLOUD_VISION_LANE,
        "dispatch_channel": SOVEREIGN_DISPATCH_CHANNEL,
        "chat_id": frame.chat_id,
        "message_id": frame.message_id,
        "prompt": frame.prompt,
        "attachment_refs": frame.attachment_refs,
        "state": "prep",
    }
