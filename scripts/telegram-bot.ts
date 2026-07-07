/**
 * Telegram bot — long polling rejimi (local development uchun)
 * Ishga tushirish: npm run telegram-bot
 */
import './load-env';
import { initializeDatabase } from '../lib/postgres';
import { handleTelegramUpdate, hasTelegramAdmins, isTelegramEnabled } from '../lib/telegram';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN .env.local faylida belgilanmagan');
  process.exit(1);
}

let offset = 0;

async function poll() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?timeout=30&offset=${offset}`,
      { signal: AbortSignal.timeout(35000) }
    );
    const data = await res.json();

    if (!data.ok) {
      console.error('Telegram API xato:', data);
      return;
    }

    for (const update of data.result || []) {
      offset = update.update_id + 1;
      try {
        await handleTelegramUpdate(update);
      } catch (err) {
        console.error('Update handle xato:', err);
      }
    }
  } catch (err) {
    console.error('Polling xato:', err);
  }
}

async function main() {
  await initializeDatabase();

  if (!isTelegramEnabled()) {
    console.warn('⚠️  TELEGRAM_CHAT_ID (guruh) belgilanmagan — test natijalari yuborilmaydi');
  }
  if (!hasTelegramAdmins()) {
    console.warn('⚠️  TELEGRAM_ADMIN_IDS belgilanmagan — bot buyruqlari ishlamaydi');
  }

  // Eski webhookni o'chirish (polling uchun)
  await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);

  console.log('🤖 Telegram bot ishga tushdi (polling)...');
  console.log('   Adminlar botga shaxsiy chatda /start va /testlar yuborishi mumkin');

  while (true) {
    await poll();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
