/**
 * Telegram bot — long polling rejimi (local development uchun)
 * Ishga tushirish: npm run telegram-bot
 *
 * Har 6 soatda foydalanuvchilar Excel faylini guruhga yuboradi.
 * Production da Vercel Cron (/api/cron/users-excel) ishlatiladi.
 */
import './load-env';
import { initializeDatabase } from '../lib/postgres';
import {
  handleTelegramUpdate,
  hasTelegramAdmins,
  isTelegramEnabled,
  sendUsersExcelToGroup,
} from '../lib/telegram';

const token = process.env.TELEGRAM_BOT_TOKEN;
const USERS_EXCEL_INTERVAL_MS = 6 * 60 * 60 * 1000;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN .env.local faylida belgilanmagan');
  process.exit(1);
}

let offset = 0;

async function sendUsersExcelSafely(reason: string) {
  if (!isTelegramEnabled()) return;
  try {
    const result = await sendUsersExcelToGroup();
    console.log(`✅ Foydalanuvchilar Excel yuborildi (${reason}):`, result.filename, result.count);
  } catch (err) {
    console.error(`❌ Foydalanuvchilar Excel yuborilmadi (${reason}):`, err);
  }
}

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
  console.log('   Har 6 soatda foydalanuvchilar Excel guruhga yuboriladi');

  // Ishga tushganda bir marta + keyin har 6 soatda
  await sendUsersExcelSafely('start');
  setInterval(() => {
    void sendUsersExcelSafely('6h-interval');
  }, USERS_EXCEL_INTERVAL_MS);

  while (true) {
    await poll();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
