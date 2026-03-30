export const notionDatabaseIds = {
  fish: process.env.NOTION_FISH_DATABASE_ID ?? '',
  orders: process.env.NOTION_ORDERS_DATABASE_ID ?? '',
  orderItems: process.env.NOTION_ORDER_ITEMS_DATABASE_ID ?? '',
  tanks: process.env.NOTION_TANKS_DATABASE_ID ?? '',
  inventory: process.env.NOTION_INVENTORY_DATABASE_ID ?? '',
  logs: process.env.NOTION_LOGS_DATABASE_ID ?? ''
} as const;

export type AquaDatabaseKey = keyof typeof notionDatabaseIds;

function notionHeaders() {
  return {
    Authorization: 'Bearer ' + (process.env.NOTION_API_KEY ?? ''),
    'Content-Type': 'application/json',
    'Notion-Version': process.env.NOTION_VERSION ?? '2022-06-28'
  };
}

export async function queryNotionDatabase<T = Record<string, unknown>>(databaseId: string, body: Record<string, unknown>) {
  const response = await fetch('https://api.notion.com/v1/databases/' + databaseId + '/query', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('Notion query failed with ' + response.status);
  }

  const data = await response.json();
  return data.results as T[];
}

export async function createNotionPage(databaseId: string, properties: Record<string, unknown>) {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: properties
    })
  });

  if (!response.ok) {
    throw new Error('Notion page creation failed with ' + response.status);
  }

  return response.json();
}
