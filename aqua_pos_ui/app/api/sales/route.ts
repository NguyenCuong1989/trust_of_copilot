import { NextResponse } from 'next/server';
import { createFishSale } from '@/lib/aqua-pos';
import { logSystemEvent } from '@/lib/notion';

export async function POST(request: Request) {
  try {
    await logSystemEvent({
      entry: 'API_SALES_REQUEST_RECEIVED',
      message: 'Received sale request payload',
      status: 'OK'
    });
    const body = await request.json();
    const result = await createFishSale(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    try {
      await logSystemEvent({
        entry: 'API_SALES_REQUEST_FAILED',
        message,
        status: 'ERROR'
      });
    } catch {}
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
