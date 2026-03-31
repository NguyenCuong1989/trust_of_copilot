import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = process.env.NOTION_API_KEY ? new Client({ auth: process.env.NOTION_API_KEY }) : null;
const SYSTEM_LOGS_DATABASE_ID = process.env.SYSTEM_LOGS_DATABASE_ID || 'f23587342b044dfcbd3e345e674a1f00';
const AFFILIATE_LOGS_DATABASE_ID = process.env.AFFILIATE_LOGS_DATABASE_ID || 'bbe418e8-4aa9-42db-885d-dbf484ab0ba7';
const AFFILIATE_SUMMARY_DATABASE_ID = process.env.AFFILIATE_SUMMARY_DATABASE_ID || 'fd2a84c3-dfa3-47b3-a06f-373ebaab1046';

function richText(value) {
  return { rich_text: [{ type: 'text', text: { content: String(value ?? '') } }] };
}

function title(value) {
  return { title: [{ type: 'text', text: { content: String(value ?? '') } }] };
}

function select(value) {
  return { select: { name: String(value) } };
}

function number(value) {
  return { number: typeof value === 'number' ? value : Number(value || 0) };
}

function date(value) {
  return { date: { start: value || new Date().toISOString() } };
}

async function createPage(databaseId, properties) {
  if (!notion) {
    throw new Error('NOTION_API_KEY is required');
  }

  return notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
}

async function logSystemEvent(eventType, message, referralCode) {
  return createPage(SYSTEM_LOGS_DATABASE_ID, {
    Event: title('AFFILIATE_' + String(eventType).toUpperCase()),
    Message: richText(message),
    Status: select('ACTIVE'),
    Module: select('AP\u03A9 AI-OS'),
    Related_Entity: richText(referralCode || 'affiliate-system'),
    Duration_ms: number(0),
    Timestamp: date(),
  });
}

async function logAffiliateEvent(eventType, referralCode, telegramUserId, payload, rewardStars, source) {
  return createPage(AFFILIATE_LOGS_DATABASE_ID, {
    Event: title('AFFILIATE_' + String(eventType).toUpperCase()),
    'Event Type': select(eventType),
    'Telegram User ID': richText(telegramUserId || ''),
    'Referral Code': richText(referralCode || ''),
    Payload: richText(payload || ''),
    'Reward Stars': number(rewardStars || 0),
    Status: select('logged'),
    'System Log ID': richText(SYSTEM_LOGS_DATABASE_ID),
    Source: richText(source || 'web-mini-app'),
  });
}

async function snapshotSummary(eventType, referralCode, telegramUserId, rewardStars) {
  return createPage(AFFILIATE_SUMMARY_DATABASE_ID, {
    Affiliate: title(referralCode || telegramUserId || eventType),
    'Telegram User ID': richText(telegramUserId || ''),
    'Referral Code': richText(referralCode || ''),
    Clicks: number(eventType === 'click' ? 1 : 0),
    Refs: number(eventType === 'ref' ? 1 : 0),
    Rewards: number(eventType === 'reward' ? 1 : 0),
    'Stars Earned': number(eventType === 'reward' ? rewardStars || 0 : 0),
    'Last Event': richText(eventType),
    Status: select('active'),
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType = ['click', 'ref', 'reward'].includes(body.eventType) ? body.eventType : 'click';
    const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim() : '';
    const telegramUserId = typeof body.telegramUserId === 'string' ? body.telegramUserId.trim() : '';
    const payload = typeof body.payload === 'string' ? body.payload : '';
    const rewardStars = Number(body.rewardStars || 0);
    const source = typeof body.source === 'string' ? body.source : 'web-mini-app';

    const systemLog = await logSystemEvent(eventType, 'affiliate ' + eventType + ' received', referralCode || telegramUserId || source);
    const affiliateLog = await logAffiliateEvent(eventType, referralCode, telegramUserId, payload, rewardStars, source);
    const summary = await snapshotSummary(eventType, referralCode, telegramUserId, rewardStars);

    return NextResponse.json({ ok: true, systemLogId: systemLog.id, affiliateLogId: affiliateLog.id, summaryId: summary.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

