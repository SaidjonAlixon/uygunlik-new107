/**
 * Telegram webhookni ulash (Vercel / production uchun)
 * Ishlatish: npm run telegram:webhook
 * yoki: npm run telegram:webhook -- https://sizning-domen.uz
 */
import './load-env';
import {
  deleteTelegramWebhook,
  getTelegramWebhookInfo,
  resolveAppUrl,
  setTelegramWebhook,
} from '../lib/telegram';

async function main() {
  const argUrl = process.argv[2]?.replace(/\/$/, '');
  const appUrl = argUrl || resolveAppUrl();

  if (!appUrl) {
    console.error('❌ URL topilmadi. Argument bering yoki NEXT_PUBLIC_APP_URL ni .env.local ga qo\'ying.');
    process.exit(1);
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  console.log(`🔗 Webhook ulanmoqda: ${webhookUrl}`);

  await setTelegramWebhook(webhookUrl);
  const info = await getTelegramWebhookInfo();

  console.log('✅ Webhook muvaffaqiyatli ulandi');
  console.log(JSON.stringify(info.result, null, 2));
  console.log('\n💡 Local polling ishlatmoqchi bo\'lsangiz: npm run telegram:webhook:off');
}

async function off() {
  await deleteTelegramWebhook();
  console.log('✅ Webhook o\'chirildi — endi local polling ishlatishingiz mumkin');
}

const cmd = process.argv[2];
if (cmd === 'off') {
  off().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
