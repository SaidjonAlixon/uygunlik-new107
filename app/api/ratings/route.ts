import { NextRequest, NextResponse } from 'next/server';
import { RatingService, initializeDatabase } from '@/lib/postgres';

const VALID_PERIODS = ['today', 'week', 'last_week'] as const;

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const tariffIdParam = searchParams.get('tariffId');
    const period = searchParams.get('period') || 'week';
    const tariffId = tariffIdParam ? parseInt(tariffIdParam) : null;

    if (tariffIdParam && isNaN(tariffId as number)) {
      return NextResponse.json({ error: 'Noto\'g\'ri tarif ID' }, { status: 400 });
    }

    if (!VALID_PERIODS.includes(period as typeof VALID_PERIODS[number])) {
      return NextResponse.json({ error: 'Noto\'g\'ri davr' }, { status: 400 });
    }

    const data = await RatingService.getLeaderboard(
      period as 'today' | 'week' | 'last_week',
      tariffId
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Rating fetch error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
