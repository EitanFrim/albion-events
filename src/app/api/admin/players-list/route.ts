export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // TODO: Replace this with your actual data fetching logic
    // e.g. const players = await prisma.player.findMany();
    // e.g. const players = await db.collection('players').find().toArray();

    const players: any[] = [];

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error('[players-list] Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
