import ExcelJS from 'exceljs';
import { TestSubmissionService } from '@/lib/postgres';

export type TelegramAnswer = {
  question?: string;
  options?: string[];
  selected?: number;
  selectedText?: string;
  correct?: number;
  correctText?: string;
  isCorrect?: boolean;
};

export type DetailedSubmission = {
  id: number;
  user_id: number;
  lesson_id: number;
  score: number;
  total_questions: number;
  answers: TelegramAnswer[] | string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  lesson_title: string;
  section_name?: string;
  tariff_name?: string;
};

function getConfig() {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    groupChatId: process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_GROUP_ID || '',
    adminIds: parseAdminIds(),
  };
}

function parseAdminIds(): string[] {
  const raw = process.env.TELEGRAM_ADMIN_IDS || '';
  return raw
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isTelegramAdmin(userId?: number | string | null): boolean {
  if (userId == null || userId === '') return false;
  const admins = getConfig().adminIds;
  if (admins.length === 0) return false;
  return admins.includes(String(userId));
}

export function isTelegramEnabled() {
  const { token, groupChatId } = getConfig();
  return Boolean(token && groupChatId);
}

export function hasTelegramAdmins() {
  return getConfig().adminIds.length > 0;
}

export function resolveAppUrl(): string | null {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return null;
}

export function verifyTelegramWebhookSecret(secretHeader: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  return secretHeader === secret;
}

export async function setTelegramWebhook(webhookUrl: string) {
  const { token } = getConfig();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN belgilanmagan');

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const payload: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  };
  if (secret) payload.secret_token = secret;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'setWebhook xato');
  }
  return data;
}

export async function deleteTelegramWebhook() {
  const { token } = getConfig();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN belgilanmagan');

  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: true }),
  });
  return res.json();
}

export async function getTelegramWebhookInfo() {
  const { token } = getConfig();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN belgilanmagan');

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  return res.json();
}

function isHeavyTelegramUpdate(update: { message?: { text?: string } }): boolean {
  const text = update.message?.text?.trim() || '';
  return text === '/testlar' || text === '📊 Barcha testlar' || text === 'Barcha testlar';
}

export { isHeavyTelegramUpdate };

function parseAnswers(raw: unknown): TelegramAnswer[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

function optionLabel(index: number, options?: string[]) {
  if (index == null || index < 0) return '—';
  const letter = String.fromCharCode(65 + index);
  const text = options?.[index];
  return text ? `${letter}) ${text}` : `${letter}) —`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatSubmissionMessage(submission: DetailedSubmission): string {
  const answers = parseAnswers(submission.answers);
  const wrong = submission.total_questions - submission.score;
  const percent = submission.total_questions > 0
    ? Math.round((submission.score * 1000) / submission.total_questions) / 10
    : 0;
  const fullName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim();
  const date = submission.created_at
    ? new Date(submission.created_at).toLocaleString('uz-UZ')
    : '—';

  const lines: string[] = [
    '📝 <b>YANGI TEST NATIJASI</b>',
    '',
    `👤 <b>Foydalanuvchi:</b> ${escapeHtml(fullName)}`,
    `📧 <b>Email:</b> ${escapeHtml(submission.email || '—')}`,
    `📚 <b>Darslik:</b> ${escapeHtml(submission.lesson_title || '—')}`,
    `📂 <b>Bo'lim:</b> ${escapeHtml(submission.section_name || '—')}`,
    `💳 <b>Tarif:</b> ${escapeHtml(submission.tariff_name || '—')}`,
    `📅 <b>Sana:</b> ${escapeHtml(date)}`,
    '',
    '━━━━━━━━━━━━━━━━',
    '<b>SAVOLLAR VA JAVOBLAR</b>',
    '━━━━━━━━━━━━━━━━',
  ];

  answers.forEach((a, i) => {
    const isCorrect = a.isCorrect ?? a.selected === a.correct;
    const icon = isCorrect ? '✅' : '❌';
    const selectedText = a.selectedText || optionLabel(a.selected ?? -1, a.options);
    const correctText = a.correctText || optionLabel(a.correct ?? -1, a.options);
    lines.push('');
    lines.push(`${icon} <b>${i + 1}-savol:</b> ${escapeHtml(a.question || '—')}`);
    lines.push(`   Tanlangan: ${escapeHtml(selectedText)}`);
    lines.push(`   To'g'ri: ${escapeHtml(correctText)}`);
  });

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('<b>📊 UMUMIY NATIJA</b>');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push(`✅ To'g'ri javoblar: <b>${submission.score}</b>`);
  lines.push(`❌ Noto'g'ri javoblar: <b>${wrong}</b>`);
  lines.push(`📋 Jami savollar: <b>${submission.total_questions}</b>`);
  lines.push(`📈 Foiz: <b>${percent}%</b>`);

  return lines.join('\n');
}

function splitMessage(text: string, maxLen = 4000): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + line + '\n').length > maxLen) {
      if (current) parts.push(current.trim());
      current = line + '\n';
    } else {
      current += line + '\n';
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  extra?: { reply_markup?: object }
) {
  const { token } = getConfig();
  if (!token) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Telegram sendMessage error:', err);
    return false;
  }
  return true;
}

export async function sendTelegramDocument(
  chatId: string,
  filename: string,
  content: string | Buffer,
  caption?: string,
  mimeType = 'application/octet-stream'
) {
  const { token } = getConfig();
  if (!token) return false;

  const form = new FormData();
  form.append('chat_id', chatId);
  if (caption) form.append('caption', caption);
  const blob = typeof content === 'string'
    ? new Blob([content], { type: mimeType })
    : new Blob([new Uint8Array(content)], { type: mimeType });
  form.append('document', blob, filename);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Telegram sendDocument error:', err);
    return false;
  }
  return true;
}

const EXCEL_HEADERS = [
  'ID',
  'Sana',
  'Foydalanuvchi',
  'Email',
  'Tarif',
  "Bo'lim",
  'Darslik',
  'Ball',
  'Jami savollar',
  'Foiz %',
  "To'g'ri",
  "Noto'g'ri",
  'Savol №',
  'Savol',
  'Tanlangan javob',
  "To'g'ri javob",
  'Holat',
] as const;

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1D4ED8' },
};

const ALT_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' },
};

const CORRECT_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDCFCE7' },
};

const WRONG_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFEE2E2' },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

const RATING_MEDALS: Record<number, ExcelJS.Fill> = {
  1: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } },
  2: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
  3: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } },
};

type UserAggregate = {
  user_id: number;
  fullName: string;
  email: string;
  tariff: string;
  tests_count: number;
  total_questions: number;
  correct: number;
  wrong: number;
  percent: number;
};

function aggregateByUser(submissions: DetailedSubmission[]): UserAggregate[] {
  const byUser = new Map<number, UserAggregate>();

  for (const s of submissions) {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
    const wrong = s.total_questions - s.score;
    const existing = byUser.get(s.user_id);

    if (existing) {
      existing.tests_count += 1;
      existing.total_questions += s.total_questions;
      existing.correct += s.score;
      existing.wrong += wrong;
      if (!existing.tariff && s.tariff_name) existing.tariff = s.tariff_name;
    } else {
      byUser.set(s.user_id, {
        user_id: s.user_id,
        fullName,
        email: s.email || '',
        tariff: s.tariff_name || '',
        tests_count: 1,
        total_questions: s.total_questions,
        correct: s.score,
        wrong,
        percent: 0,
      });
    }
  }

  return Array.from(byUser.values()).map((u) => ({
    ...u,
    percent: u.total_questions > 0
      ? Math.round((u.correct * 1000) / u.total_questions) / 10
      : 0,
  }));
}

function sortForRating(users: UserAggregate[]): UserAggregate[] {
  return [...users].sort((a, b) => {
    if (b.tests_count !== a.tests_count) return b.tests_count - a.tests_count;
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.fullName.localeCompare(b.fullName);
  });
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, headers: string[]) {
  const headerRow = sheet.addRow(headers);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E40AF' } },
      left: { style: 'thin', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      right: { style: 'thin', color: { argb: 'FF1E40AF' } },
    };
  });
  return headerRow;
}

function applyRowStyle(row: ExcelJS.Row, fill?: ExcelJS.Fill) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', wrapText: true };
    if (fill) cell.fill = fill;
  });
}

export async function generateTestsExcel(submissions: DetailedSubmission[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Uygunlik';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Test natijalari', {
    views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  });

  sheet.columns = [
    { key: 'id', width: 7 },
    { key: 'date', width: 20 },
    { key: 'user', width: 22 },
    { key: 'email', width: 26 },
    { key: 'tariff', width: 14 },
    { key: 'section', width: 20 },
    { key: 'lesson', width: 18 },
    { key: 'score', width: 8 },
    { key: 'total', width: 14 },
    { key: 'percent', width: 10 },
    { key: 'correct', width: 10 },
    { key: 'wrong', width: 12 },
    { key: 'qNum', width: 10 },
    { key: 'question', width: 36 },
    { key: 'selected', width: 28 },
    { key: 'correctAns', width: 28 },
    { key: 'status', width: 12 },
  ];

  styleHeaderRow(sheet, [...EXCEL_HEADERS]);

  let rowIndex = 0;
  for (const s of submissions) {
    const answers = parseAnswers(s.answers);
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
    const date = s.created_at ? new Date(s.created_at) : null;
    const wrong = s.total_questions - s.score;
    const percent = s.total_questions > 0
      ? Math.round((s.score * 1000) / s.total_questions) / 10
      : 0;
    const altFill = rowIndex % 2 === 1 ? ALT_ROW_FILL : undefined;

    const base = {
      id: s.id,
      date,
      user: fullName,
      email: s.email || '',
      tariff: s.tariff_name || '',
      section: s.section_name || '',
      lesson: s.lesson_title || '',
      score: s.score,
      total: s.total_questions,
      percent,
      correct: s.score,
      wrong,
    };

    if (answers.length === 0) {
      const row = sheet.addRow({ ...base, qNum: '', question: '', selected: '', correctAns: '', status: '' });
      applyRowStyle(row, altFill);
      if (date) row.getCell('date').numFmt = 'dd.mm.yyyy hh:mm';
      rowIndex++;
      continue;
    }

    answers.forEach((a, idx) => {
      const isCorrect = a.isCorrect ?? a.selected === a.correct;
      const status = isCorrect ? "To'g'ri" : "Noto'g'ri";
      const row = sheet.addRow({
        ...base,
        qNum: idx + 1,
        question: a.question || '',
        selected: a.selectedText || optionLabel(a.selected ?? -1, a.options),
        correctAns: a.correctText || optionLabel(a.correct ?? -1, a.options),
        status,
      });
      applyRowStyle(row, altFill);
      if (date) row.getCell('date').numFmt = 'dd.mm.yyyy hh:mm';

      const statusCell = row.getCell('status');
      statusCell.fill = isCorrect ? CORRECT_FILL : WRONG_FILL;
      statusCell.font = { bold: true, color: { argb: isCorrect ? 'FF166534' : 'FF991B1B' } };
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

      rowIndex++;
    });
  }

  sheet.autoFilter = { from: 'A1', to: `Q${sheet.rowCount}` };

  // --- Natijalar (foydalanuvchi bo'yicha umumiy) ---
  const userStats = aggregateByUser(submissions);
  const natijalar = workbook.addWorksheet('Natijalar', {
    views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  });
  natijalar.columns = [
    { key: 'user', width: 24 },
    { key: 'email', width: 28 },
    { key: 'tariff', width: 14 },
    { key: 'tests', width: 14 },
    { key: 'total', width: 14 },
    { key: 'correct', width: 12 },
    { key: 'wrong', width: 12 },
    { key: 'percent', width: 10 },
  ];
  styleHeaderRow(natijalar, [
    'Foydalanuvchi',
    'Email',
    'Tarif',
    'Testlar soni',
    'Jami savollar',
    "To'g'ri",
    "Noto'g'ri",
    'Foiz %',
  ]);

  userStats
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .forEach((u, idx) => {
      const row = natijalar.addRow({
        user: u.fullName,
        email: u.email,
        tariff: u.tariff,
        tests: u.tests_count,
        total: u.total_questions,
        correct: u.correct,
        wrong: u.wrong,
        percent: u.percent,
      });
      applyRowStyle(row, idx % 2 === 1 ? ALT_ROW_FILL : undefined);
      row.getCell('percent').alignment = { vertical: 'middle', horizontal: 'center' };
    });
  natijalar.autoFilter = { from: 'A1', to: `H${natijalar.rowCount}` };

  // --- Reyting ---
  const ranked = sortForRating(userStats);
  const reyting = workbook.addWorksheet('Reyting', {
    views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  });
  reyting.columns = [
    { key: 'rank', width: 8 },
    { key: 'user', width: 24 },
    { key: 'tests', width: 14 },
    { key: 'total', width: 14 },
    { key: 'correct', width: 12 },
    { key: 'wrong', width: 12 },
    { key: 'percent', width: 10 },
  ];
  styleHeaderRow(reyting, [
    "O'rin",
    'Foydalanuvchi',
    'Testlar soni',
    'Jami savollar',
    "To'g'ri",
    "Noto'g'ri",
    'Foiz %',
  ]);

  ranked.forEach((u, idx) => {
    const rank = idx + 1;
    const row = reyting.addRow({
      rank,
      user: u.fullName,
      tests: u.tests_count,
      total: u.total_questions,
      correct: u.correct,
      wrong: u.wrong,
      percent: u.percent,
    });
    const medalFill = RATING_MEDALS[rank] || (idx % 2 === 1 ? ALT_ROW_FILL : undefined);
    applyRowStyle(row, medalFill);
    row.getCell('rank').font = { bold: true, size: 12 };
    row.getCell('rank').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('percent').alignment = { vertical: 'middle', horizontal: 'center' };
    if (rank <= 3) {
      row.getCell('user').font = { bold: true };
    }
  });
  reyting.autoFilter = { from: 'A1', to: `G${reyting.rowCount}` };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function notifyTelegramTestSubmission(submissionId: number) {
  if (!isTelegramEnabled()) return;

  try {
    const submission = await TestSubmissionService.findDetailedById(submissionId);
    if (!submission) return;

    const { groupChatId } = getConfig();
    const message = formatSubmissionMessage(submission as DetailedSubmission);
    const parts = splitMessage(message);

    for (const part of parts) {
      await sendTelegramMessage(groupChatId, part);
    }
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

export async function sendAllTestsExport(chatId: string) {
  const submissions = await TestSubmissionService.findAllDetailed();
  if (submissions.length === 0) {
    await sendTelegramMessage(chatId, '📭 Hozircha test natijalari mavjud emas.');
    return;
  }

  const excel = await generateTestsExcel(submissions as DetailedSubmission[]);
  const filename = `barcha-testlar-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const uniqueUsers = new Set(submissions.map((s) => s.user_id)).size;

  await sendTelegramMessage(
    chatId,
    `📊 <b>Barcha testlar hisoboti</b>\n\n` +
    `👥 Ishtirokchilar: <b>${uniqueUsers}</b>\n` +
    `📝 Jami topshirishlar: <b>${submissions.length}</b>\n\n` +
    `Excel fayl yuborilmoqda (3 ta varaq: Test natijalari, Natijalar, Reyting)...`
  );

  await sendTelegramDocument(
    chatId,
    filename,
    excel,
    '📥 Barcha ishtirokchilar test natijalari (Excel)',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export const TELEGRAM_MAIN_KEYBOARD = {
  reply_markup: {
    keyboard: [[{ text: '📊 Barcha testlar' }]],
    resize_keyboard: true,
  },
};

export async function handleTelegramUpdate(update: {
  message?: {
    chat: { id: number };
    from?: { id: number; first_name?: string; last_name?: string; username?: string };
    text?: string;
  };
}) {
  const message = update.message;
  if (!message?.text) return;

  const chatId = String(message.chat.id);
  const userId = message.from?.id;
  const text = message.text.trim();

  if (text === '/myid' || text === '/id') {
    if (!userId) return;
    await sendTelegramMessage(
      chatId,
      `🆔 <b>Sizning Telegram ID:</b> <code>${userId}</code>\n\n` +
      'Admin qo\'shish uchun bu ID ni TELEGRAM_ADMIN_IDS ga yozing.'
    );
    return;
  }

  if (!isTelegramAdmin(userId)) {
    if (text.startsWith('/')) {
      await sendTelegramMessage(
        chatId,
        '⛔ Bu buyruq faqat adminlar uchun.\n\n' +
        'O\'z ID ingizni bilish: /myid'
      );
    }
    return;
  }

  if (text === '/start') {
    await sendTelegramMessage(
      chatId,
      '👋 <b>Uygunlik test boti</b>\n\n' +
      '✅ Siz admin sifatida tizimga kirdingiz.\n\n' +
      '📌 <b>/testlar</b> — barcha testlarni Excel (.xlsx) ko\'rinishida yuklab olish\n' +
      '📌 <b>Barcha testlar</b> tugmasi — xuddi shu hisobot\n' +
      '📌 <b>/myid</b> — Telegram ID ni ko\'rish\n\n' +
      'Test natijalari avtomatik ravishda belgilangan guruhga yuboriladi.',
      TELEGRAM_MAIN_KEYBOARD
    );
    return;
  }

  if (text === '/testlar' || text === '📊 Barcha testlar' || text === 'Barcha testlar') {
    await sendTelegramMessage(chatId, '⏳ Barcha testlar tayyorlanmoqda...');
    await sendAllTestsExport(chatId);
    return;
  }
}
