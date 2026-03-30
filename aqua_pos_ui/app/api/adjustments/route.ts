import { NextResponse } from 'next/server';
import { recordInventoryAdjustment } from '@/lib/aqua-pos';
import { logSystemEvent } from '@/lib/notion';

export async function POST(request: Request) {
  try {
    await logSystemEvent({
      entry: 'API_ADJUSTMENT_REQUEST_RECEIVED',
      message: 'Received inventory adjustment request payload',
      status: 'OK'
    });
    const body = await request.json();
    const result = await recordInventoryAdjustment(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    try {
      await logSystemEvent({
        entry: 'API_ADJUSTMENT_REQUEST_FAILED',
        message,
        status: 'ERROR'
      });
    } catch {}
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
