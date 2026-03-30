import { NextResponse } from 'next/server';
import { recordInventoryAdjustment } from '@/lib/aqua-pos';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await recordInventoryAdjustment(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
