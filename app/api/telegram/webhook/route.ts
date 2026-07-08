import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/postgres';
import {
  getTelegramWebhookInfo,
  handleTelegramUpdate,
  resolveAppUrl,
  setTelegramWebhook,
  verifyTelegramWebhookSecret,
} from '@/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function processUpdate(update: unknown) {
  await initializeDatabase();
  await handleTelegramUpdate(update as Parameters<typeof handleTelegramUpdate>[0]);
}

export async function POST(request: NextRequest) {
  try {
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (!verifyTelegramWebhookSecret(secretHeader)) {
      console.error('Telegram webhook: secret token mos kelmadi');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await request.json();
    console.log('Telegram webhook update:', update?.message?.text || update?.update_id);

    await processUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

/** Webhookni ulash: GET /api/telegram/webhook?setup=SIZNING_KALIT */
export async function GET(request: NextRequest) {
  const setupKey = request.nextUrl.searchParams.get('setup');
  const expected = process.env.TELEGRAM_SETUP_KEY || process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expected || setupKey !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = resolveAppUrl();
  if (!appUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL Vercel da belgilanmagan' },
      { status: 500 }
    );
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  await setTelegramWebhook(webhookUrl);
  const info = await getTelegramWebhookInfo();

  return NextResponse.json({
    ok: true,
    webhookUrl,
    info: info.result,
    tip: 'Endi botga /start yuboring. TELEGRAM_ADMIN_IDS da ID ingiz bo\'lishi kerak.',
  });
}
