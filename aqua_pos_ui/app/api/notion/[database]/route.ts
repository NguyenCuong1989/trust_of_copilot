import { NextResponse } from 'next/server';
import { archivePage, createPageInDatabase, getPage, queryDatabaseByKey, updatePage, type AquaDatabaseKey } from '@/lib/notion';

function isAquaDatabaseKey(value: string): value is AquaDatabaseKey {
  return ['fish', 'orders', 'orderItems', 'inventory', 'tanks', 'customers', 'suppliers', 'purchases', 'inventoryAdjustments', 'systemLogs'].includes(value);
}

export async function GET(request: Request, { params }: { params: { database: string } }) {
  if (!isAquaDatabaseKey(params.database)) {
    return NextResponse.json({ error: 'Unsupported database key' }, { status: 400 });
  }

  const url = new URL(request.url);
  const pageId = url.searchParams.get('pageId');
  if (pageId) {
    const page = await getPage(pageId);
    return NextResponse.json(page);
  }

  const pageSize = Number(url.searchParams.get('pageSize') ?? '10');
  const data = await queryDatabaseByKey(params.database, { page_size: Number.isFinite(pageSize) ? pageSize : 10 });
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: { params: { database: string } }) {
  if (!isAquaDatabaseKey(params.database)) {
    return NextResponse.json({ error: 'Unsupported database key' }, { status: 400 });
  }

  const body = await request.json();
  const created = await createPageInDatabase(params.database, body.properties ?? body);
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (!body.pageId) {
    return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
  }

  const updated = await updatePage(body.pageId, body.properties ?? {});
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const body = await request.json();
  if (!body.pageId) {
    return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
  }

  const archived = await archivePage(body.pageId);
  return NextResponse.json(archived);
}
