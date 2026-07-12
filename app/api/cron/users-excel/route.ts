import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/postgres';
import { sendUsersExcelToGroup, isTelegramEnabled } from '@/lib/telegram';

export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const secret =
    process.env.CRON_SECRET ||
    process.env.TELEGRAM_SETUP_KEY ||
    process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secret) return false;

  const auth = request.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;

  const key = request.nextUrl.searchParams.get('key');
  if (key && key === secret) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isTelegramEnabled()) {
    return NextResponse.json(
      { error: 'TELEGRAM_CHAT_ID belgilanmagan' },
      { status: 503 }
    );
  }

  try {
    await initializeDatabase();
    const result = await sendUsersExcelToGroup();
    return NextResponse.json({
      ok: true,
      ...result,
      at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Cron users-excel error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server xatoligi' },
      { status: 500 }
    );
  }
}
