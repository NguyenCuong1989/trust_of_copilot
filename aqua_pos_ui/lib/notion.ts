export const AQUA_DATABASES = {
  fish: process.env.NOTION_FISH_DATABASE_ID ?? '',
  orders: process.env.NOTION_ORDERS_DATABASE_ID ?? '',
  orderItems: process.env.NOTION_ORDER_ITEMS_DATABASE_ID ?? '',
  inventory: process.env.NOTION_INVENTORY_DATABASE_ID ?? '',
  tanks: process.env.NOTION_TANKS_DATABASE_ID ?? '',
  customers: process.env.NOTION_CUSTOMERS_DATABASE_ID ?? '',
  suppliers: process.env.NOTION_SUPPLIERS_DATABASE_ID ?? '',
  purchases: process.env.NOTION_PURCHASES_DATABASE_ID ?? '',
  inventoryAdjustments: process.env.NOTION_INVENTORY_ADJUSTMENTS_DATABASE_ID ?? '',
  systemLogs: process.env.NOTION_SYSTEM_LOGS_DATABASE_ID ?? process.env.NOTION_LOGS_DATABASE_ID ?? ''
} as const;

export type AquaDatabaseKey = keyof typeof AQUA_DATABASES;
export type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR';

type NotionPropertyValue = Record<string, unknown>;

function headers() {
  if (!process.env.NOTION_API_KEY) {
    throw new Error('Missing NOTION_API_KEY');
  }

  return {
    Authorization: 'Bearer ' + process.env.NOTION_API_KEY,
    'Content-Type': 'application/json',
    'Notion-Version': process.env.NOTION_VERSION ?? '2022-06-28'
  };
}

export function getDatabaseId(key: AquaDatabaseKey) {
  const id = AQUA_DATABASES[key];
  if (!id) {
    throw new Error('Missing Notion database ID for ' + key);
  }
  return id;
}

async function notionFetch(path: string, init?: RequestInit) {
  const response = await fetch('https://api.notion.com/v1' + path, {
    ...init,
    headers: {
      ...headers(),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error('Notion API ' + response.status + ': ' + message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function textProp(value: string) {
  return { rich_text: [{ type: 'text', text: { content: value } }] };
}

export function titleProp(value: string) {
  return { title: [{ type: 'text', text: { content: value } }] };
}

export function numberProp(value: number) {
  return { number: value };
}

export function selectProp(value: string) {
  return { select: { name: value } };
}

export function relationProp(pageIds: string[]) {
  return { relation: pageIds.map((id) => ({ id })) };
}

export function checkboxProp(value: boolean) {
  return { checkbox: value };
}

export async function queryDatabaseByKey(key: AquaDatabaseKey, body: Record<string, unknown> = {}) {
  return notionFetch('/databases/' + getDatabaseId(key) + '/query', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function createPageInDatabase(key: AquaDatabaseKey, properties: Record<string, NotionPropertyValue>) {
  return notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: getDatabaseId(key) },
      properties
    })
  });
}

export async function updatePage(pageId: string, properties: Record<string, NotionPropertyValue>) {
  return notionFetch('/pages/' + pageId, {
    method: 'PATCH',
    body: JSON.stringify({ properties })
  });
}

export async function archivePage(pageId: string) {
  return notionFetch('/pages/' + pageId, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true })
  });
}

export async function getPage(pageId: string) {
  return notionFetch('/pages/' + pageId, { method: 'GET' });
}

export function readNumber(page: any, propertyName: string) {
  const prop = page?.properties?.[propertyName];
  return typeof prop?.number === 'number' ? prop.number : 0;
}

export function readTitle(page: any, propertyName: string) {
  const prop = page?.properties?.[propertyName];
  const text = prop?.title?.[0]?.plain_text ?? prop?.rich_text?.[0]?.plain_text ?? '';
  return String(text);
}

export function readSelect(page: any, propertyName: string) {
  return page?.properties?.[propertyName]?.select?.name ?? '';
}

export function normalizeQuantity(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value) : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error('Quantity must be a number');
  }
  return parsed;
}

export async function logSystemEvent(input: {
  entry: string;
  message: string;
  module?: string;
  status?: LogLevel;
  relatedEntity?: string;
}) {
  const status = input.status ?? 'OK';
  return createPageInDatabase('systemLogs', {
    'Log Entry': titleProp(input.entry),
    Status: selectProp(status === 'OK' ? '🟢 OK' : status === 'INFO' ? '🔵 Info' : status === 'WARN' ? '⚠️ Warning' : '🔴 Critical'),
    Message: textProp(input.message),
    Module: selectProp(input.module ?? 'APΩ AI-OS'),
    Related_Entity: textProp(input.relatedEntity ?? '')
  });
}
