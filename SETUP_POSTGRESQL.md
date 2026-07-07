# PostgreSQL Database Setup

## Environment Variables

### 1. Frontend (.env.local)
`.env.local` faylini loyiha ildizida yarating va quyidagi ma'lumotlarni qo'shing:

```env
DATABASE_URL=postgresql://postgres:sfEwhZMzkSILIFEoaYxhisQdfmhdaXWl@maglev.proxy.rlwy.net:18934/railway
NEXT_PUBLIC_API_URL=/api
JWT_SECRET=your_local_jwt_secret_key_here_change_this_in_production
ADMIN_EMAIL=admin@uygunlik.uz
ADMIN_PASSWORD=Admin123!
```

### 2. Backend (client/.env)
`client/.env` faylini yarating va quyidagi ma'lumotlarni qo'shing:

```env
# Database
DATABASE_URL=postgresql://postgres:sfEwhZMzkSILIFEoaYxhisQdfmhdaXWl@maglev.proxy.rlwy.net:18934/railway

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRES_IN=1d

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Admin Credentials
ADMIN_EMAIL=admin@uygunlik.uz
ADMIN_PASSWORD=Admin123!

# Email (Eskiz) - Optional
ESKIZ_EMAIL=
ESKIZ_PASSWORD=

# File Upload
MAX_FILE_SIZE=2147483648
UPLOAD_DEST=./uploads
```

## Admin Foydalanuvchi

Loyiha ishga tushganda avtomatik ravishda admin foydalanuvchi yaratiladi:

- **Email**: admin@uygunlik.uz (yoki ADMIN_EMAIL environment variable'dan)
- **Parol**: Admin123! (yoki ADMIN_PASSWORD environment variable'dan)

Agar boshqa email yoki parol kerak bo'lsa, yuqoridagi environment variable'larni o'zgartiring.

## Database Connection

Loyiha endi PostgreSQL bazasiga ulanadi:
- **Frontend**: `lib/postgres.ts` orqali PostgreSQL ishlatadi
- **Backend**: TypeORM orqali PostgreSQL ishlatadi

Ikkala qism ham bir xil `DATABASE_URL` environment variable'dan foydalanadi.

## Tekshirish

1. Environment fayllarni yarating
2. Serverlarni qayta ishga tushiring: `npm run dev:full`
3. Admin panelga kirish: http://localhost:3000/admin
   - Email: admin@uygunlik.uz
   - Parol: Admin123!

## Telegram Bot

### Sozlash
1. [@BotFather](https://t.me/BotFather) da yangi bot yarating va token oling
2. Botni guruhga qo'shing va admin qiling
3. Guruh chat ID sini oling (masalan [@userinfobot](https://t.me/userinfobot) yoki getUpdates orqali)
4. `.env.local` ga qo'shing:

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_WEBHOOK_SECRET=random_uzun_kalit_123
TELEGRAM_SETUP_KEY=admin_ornatish_kaliti
NEXT_PUBLIC_APP_URL=https://sizning-domen.uz
```

### Local (kompyuterda)
```bash
npm run telegram-bot
```

Yoki hammasi birga:
```bash
npm run dev:all
```

### Vercel (production)

Vercelda long-polling ishlamaydi — **webhook** ishlatiladi.

1. Vercel Dashboard → Settings → Environment Variables ga qo'shing:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `TELEGRAM_WEBHOOK_SECRET` (ixtiyoriy, lekin tavsiya etiladi)
   - `TELEGRAM_SETUP_KEY` (webhook ulash uchun)
   - `NEXT_PUBLIC_APP_URL` (masalan `https://uygunlik.uz`)
   - `DATABASE_URL`, `JWT_SECRET` va boshqalar

2. Deploy qiling

3. Webhookni ulang (bittasini tanlang):

**Variant A — brauzerda:**
```
https://sizning-domen.uz/api/telegram/webhook?setup=TELEGRAM_SETUP_KEY
```

**Variant B — terminalda:**
```bash
npm run telegram:webhook -- https://sizning-domen.uz
```

4. Local polling ishlatmoqchi bo'lsangiz, avval webhookni o'chiring:
```bash
npm run telegram:webhook:off
npm run telegram-bot
```

> ⚠️ Bir vaqtning o'zida polling va webhook ishlamaydi — faqat bittasini ishlating.

### Buyruqlar
- `/start` — bot haqida ma'lumot va tugmalar
- `/testlar` yoki **Barcha testlar** tugmasi — barcha natijalarni Excel (.xlsx) fayl sifatida yuklash
- Har bir test topshirilganda guruhga batafsil natija avtomatik yuboriladi
