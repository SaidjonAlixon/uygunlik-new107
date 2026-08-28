/**
 * Vercel deploydan keyin webhookni avtomatik ulash
 */
import { getTelegramWebhookInfo, resolveAppUrl, setTelegramWebhook } from '../lib/telegram';

async function main() {
  if (process.env.VERCEL !== '1') return;
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⏭️  TELEGRAM_BOT_TOKEN yo\'q — webhook o\'tkazib yuborildi');
    return;
  }

  const appUrl = resolveAppUrl();
  if (!appUrl) {
    console.log('⏭️  NEXT_PUBLIC_APP_URL yo\'q — webhook o\'tkazib yuborildi');
    return;
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  console.log(`🔗 Vercel webhook ulanmoqda: ${webhookUrl}`);

  await setTelegramWebhook(webhookUrl);
  const info = await getTelegramWebhookInfo();
  console.log('✅ Webhook holati:', JSON.stringify(info.result, null, 2));
}

main().catch((err) => {
  console.error('⚠️  Webhook avtomatik ulanmadi:', err);
  process.exit(0);
});
