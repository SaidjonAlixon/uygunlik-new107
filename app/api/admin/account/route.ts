import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { createToken } from '@/lib/jwt';
import { UserService } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  const user = await UserService.findById(admin.id);
  if (!user) {
    return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
  }
  return NextResponse.json({ email: user.email });
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword || '');
    const email = String(body.email || '').trim().toLowerCase();
    const newPassword = String(body.newPassword || '');

    const user = await UserService.findById(admin.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ error: "Joriy parol noto'g'ri" }, { status: 400 });
    }

    const updates: { email?: string; password?: string } = {};
    if (email && email !== String(user.email).toLowerCase()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Email noto'g'ri" }, { status: 400 });
      }
      const existing = await UserService.findByEmail(email);
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Bu email band' }, { status: 400 });
      }
      updates.email = email;
    }
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak" }, { status: 400 });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }
    if (!updates.email && !updates.password) {
      return NextResponse.json({ error: "O'zgartirish uchun yangi email yoki parol kiriting" }, { status: 400 });
    }

    const updated = await UserService.update(user.id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Yangilanmadi' }, { status: 500 });
    }
    const { password: _, ...rest } = updated;
    const token = createToken({ id: updated.id, email: updated.email, role: updated.role });
    return NextResponse.json({ user: rest, token });
  } catch (error) {
    console.error('admin account update error', error);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
