import { NextRequest, NextResponse } from 'next/server';
import {
  getTelegramWebhookInfo,
  hasTelegramAdmins,
  isTelegramEnabled,
  resolveAppUrl,
  setTelegramWebhook,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const expected = process.env.TELEGRAM_SETUP_KEY || process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expected || key !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = resolveAppUrl();
  const info = process.env.TELEGRAM_BOT_TOKEN
    ? await getTelegramWebhookInfo()
  : { ok: false, result: null };

  const webhookUrl = appUrl ? `${appUrl}/api/telegram/webhook` : null;
  const currentUrl = info.result?.url || '';
  const needsSetup = !currentUrl || (webhookUrl && currentUrl !== webhookUrl);

  if (request.nextUrl.searchParams.get('fix') === '1' && webhookUrl) {
    await setTelegramWebhook(webhookUrl);
    const fixed = await getTelegramWebhookInfo();
    return NextResponse.json({
      ok: true,
      fixed: true,
      webhookUrl,
      info: fixed.result,
      telegramEnabled: isTelegramEnabled(),
      hasAdmins: hasTelegramAdmins(),
    });
  }

  return NextResponse.json({
    ok: true,
    appUrl,
    expectedWebhookUrl: webhookUrl,
    telegramEnabled: isTelegramEnabled(),
    hasAdmins: hasTelegramAdmins(),
    adminIdsConfigured: Boolean(process.env.TELEGRAM_ADMIN_IDS),
    webhook: info.result,
    needsSetup,
    fixUrl: webhookUrl
      ? `${appUrl}/api/telegram/status?key=${key}&fix=1`
      : null,
  });
}
