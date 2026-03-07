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
