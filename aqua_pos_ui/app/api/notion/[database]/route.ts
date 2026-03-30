import { NextResponse } from 'next/server';
import { archivePage, createPageInDatabase, getPage, logSystemEvent, queryDatabaseByKey, updatePage, type AquaDatabaseKey } from '@/lib/notion';

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
  await logSystemEvent({
    entry: 'API_NOTION_CREATE_REQUEST_RECEIVED',
    message: 'Create request received for ' + params.database,
    relatedEntity: params.database,
    status: 'OK'
  });
  const created = await createPageInDatabase(params.database, body.properties ?? body);
  await logSystemEvent({
    entry: 'API_NOTION_CREATE_APPLIED',
    message: 'Created registry item in ' + params.database,
    relatedEntity: (created as any).id as string,
    status: 'OK'
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (!body.pageId) {
    return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
  }

  await logSystemEvent({
    entry: 'API_NOTION_UPDATE_REQUEST_RECEIVED',
    message: 'Update request received for ' + body.pageId,
    relatedEntity: body.pageId,
    status: 'OK'
  });
  const updated = await updatePage(body.pageId, body.properties ?? {});
  await logSystemEvent({
    entry: 'API_NOTION_UPDATE_APPLIED',
    message: 'Updated registry item ' + body.pageId,
    relatedEntity: body.pageId,
    status: 'OK'
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const body = await request.json();
  if (!body.pageId) {
    return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
  }

  await logSystemEvent({
    entry: 'API_NOTION_DELETE_REQUEST_RECEIVED',
    message: 'Archive/delete request received for ' + body.pageId,
    relatedEntity: body.pageId,
    status: 'OK'
  });
  const archived = await archivePage(body.pageId);
  await logSystemEvent({
    entry: 'API_NOTION_DELETE_APPLIED',
    message: 'Archived registry item ' + body.pageId,
    relatedEntity: body.pageId,
    status: 'OK'
  });
  return NextResponse.json(archived);
}
