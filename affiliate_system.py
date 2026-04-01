#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

SYSTEM_LOGS_DATABASE_ID = os.getenv('SYSTEM_LOGS_DATABASE_ID', 'f23587342b044dfcbd3e345e674a1f00')
AFFILIATE_LOGS_DATABASE_ID = os.getenv('AFFILIATE_LOGS_DATABASE_ID', 'bbe418e8-4aa9-42db-885d-dbf484ab0ba7')
AFFILIATE_SUMMARY_DATABASE_ID = os.getenv('AFFILIATE_SUMMARY_DATABASE_ID', 'fd2a84c3-dfa3-47b3-a06f-373ebaab1046')
TON_WALLET_ADDRESS = os.getenv('TON_WALLET_ADDRESS', 'UQBKK8o7TYYTGIm8BDTBiG2xBUvpj0tEYoXXd3SFLqJbhBhp')
NOTION_API_KEY = os.getenv('NOTION_API_KEY') or os.getenv('NOTION_TOKEN')
NOTION_API_BASE = 'https://api.notion.com/v1'
NOTION_API_VERSION = '2022-06-28'
START_REF_PATTERN = re.compile(r'^ref(?:[:=_-](?P<code>[A-Za-z0-9_-]+))?$', re.IGNORECASE)


@dataclass
class AffiliateEvent:
    event_type: str
    referral_code: str | None
    telegram_user_id: str | None = None
    payload: str = ''
    reward_stars: int = 0
    source: str = 'telegram'
    status: str = 'logged'


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_start_payload(payload: str | None) -> Dict[str, Any]:
    raw_payload = (payload or '').strip()
    if not raw_payload:
        return {'kind': 'direct', 'referral_code': None, 'raw_payload': ''}

    match = START_REF_PATTERN.match(raw_payload)
    if match:
        referral_code = match.group('code') or raw_payload
        return {'kind': 'ref', 'referral_code': referral_code, 'raw_payload': raw_payload}

    return {'kind': 'payload', 'referral_code': raw_payload, 'raw_payload': raw_payload}


def _notion_headers() -> Dict[str, str]:
    if not NOTION_API_KEY:
        raise RuntimeError('NOTION_API_KEY or NOTION_TOKEN is required')
    return {
        'Authorization': f'Bearer {NOTION_API_KEY}',
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_API_VERSION,
    }


def _rich_text(value: str) -> Dict[str, Any]:
    return {'rich_text': [{'type': 'text', 'text': {'content': value}}]}


def _title(value: str) -> Dict[str, Any]:
    return {'title': [{'type': 'text', 'text': {'content': value}}]}


def _select(value: str) -> Dict[str, Any]:
    return {'select': {'name': value}}


def _number(value: int | float | None) -> Dict[str, Any]:
    return {'number': value}


def _date(value: str) -> Dict[str, Any]:
    return {'date': {'start': value}}


def _create_page(database_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
    request = urllib.request.Request(
        f'{NOTION_API_BASE}/pages',
        data=json.dumps({'parent': {'database_id': database_id}, 'properties': properties}).encode('utf-8'),
        headers=_notion_headers(),
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def log_system_event(event_name: str, message: str, *, related_entity: str = 'affiliate-system', status: str = 'ACTIVE', module: str = 'AP\u03A9 AI-OS', duration_ms: int = 0, error_code: Optional[str] = None, timestamp: Optional[str] = None) -> Dict[str, Any]:
    properties: Dict[str, Any] = {
        'Event': _title(event_name),
        'Message': _rich_text(message),
        'Status': _select(status),
        'Module': _select(module),
        'Related_Entity': _rich_text(related_entity),
        'Duration_ms': _number(duration_ms),
        'Timestamp': _date(timestamp or _utc_now()),
    }
    if error_code:
        properties['Error_Code'] = _rich_text(error_code)
    return _create_page(SYSTEM_LOGS_DATABASE_ID, properties)


def log_affiliate_event(event: AffiliateEvent) -> Dict[str, Any]:
    properties: Dict[str, Any] = {
        'Event': _title('AFFILIATE_' + event.event_type.upper()),
        'Event Type': _select(event.event_type),
        'Telegram User ID': _rich_text(event.telegram_user_id or ''),
        'Referral Code': _rich_text(event.referral_code or ''),
        'Payload': _rich_text(event.payload),
        'Reward Stars': _number(event.reward_stars),
        'Status': _select(event.status),
        'System Log ID': _rich_text(SYSTEM_LOGS_DATABASE_ID),
        'Source': _rich_text(event.source),
    }
    return _create_page(AFFILIATE_LOGS_DATABASE_ID, properties)


def snapshot_affiliate_summary(event: AffiliateEvent) -> Dict[str, Any]:
    summary_title = event.referral_code or event.telegram_user_id or event.event_type
    properties: Dict[str, Any] = {
        'Affiliate': _title(summary_title),
        'Telegram User ID': _rich_text(event.telegram_user_id or ''),
        'Referral Code': _rich_text(event.referral_code or ''),
        'Clicks': _number(1 if event.event_type == 'click' else 0),
        'Refs': _number(1 if event.event_type == 'ref' else 0),
        'Rewards': _number(1 if event.event_type == 'reward' else 0),
        'Stars Earned': _number(event.reward_stars if event.event_type == 'reward' else 0),
        'Last Event': _rich_text(event.event_type),
        'Status': _select('active'),
    }
    return _create_page(AFFILIATE_SUMMARY_DATABASE_ID, properties)


def handle_start_payload(payload: str | None, *, telegram_user_id: str | None = None, source: str = 'telegram') -> Dict[str, Any]:
    parsed = parse_start_payload(payload)
    event = AffiliateEvent(
        event_type='click',
        referral_code=parsed['referral_code'],
        telegram_user_id=telegram_user_id,
        payload=parsed['raw_payload'],
        source=source,
    )
    system_log = log_system_event('AFFILIATE_START', f"/start payload received: {parsed['raw_payload'] or '<empty>'}", related_entity=telegram_user_id or 'telegram')
    affiliate_log = log_affiliate_event(event)
    summary_snapshot = snapshot_affiliate_summary(event)
    return {
        'system_log': system_log,
        'affiliate_log': affiliate_log,
        'summary_snapshot': summary_snapshot,
        'parsed': parsed,
    }


def handle_reward_event(referral_code: str, reward_stars: int, *, telegram_user_id: str | None = None, source: str = 'telegram') -> Dict[str, Any]:
    event = AffiliateEvent(
        event_type='reward',
        referral_code=referral_code,
        telegram_user_id=telegram_user_id,
        payload=f'reward:{reward_stars}',
        reward_stars=reward_stars,
        source=source,
    )
    system_log = log_system_event('AFFILIATE_REWARD', f'reward granted: {reward_stars} stars to {TON_WALLET_ADDRESS}', related_entity=telegram_user_id or referral_code)
    affiliate_log = log_affiliate_event(event)
    summary_snapshot = snapshot_affiliate_summary(event)
    return {
        'system_log': system_log,
        'affiliate_log': affiliate_log,
        'summary_snapshot': summary_snapshot,
        'ton_wallet_address': TON_WALLET_ADDRESS,
    }

