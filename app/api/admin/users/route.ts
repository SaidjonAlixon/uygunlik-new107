import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { UserService, initializeDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = (searchParams.get('search') || '').trim();
    const result = await UserService.findAll(page, limit, search);
    const data = result.data.map((u: Record<string, unknown>) => {
      const { password: _, ...rest } = u;
      return rest;
    });
    return NextResponse.json({ data, total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const body = await request.json();
    const { first_name, last_name, email, password, role, status, phone } = body;
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: "Ism, familiya, email va parol to'ldirilishi kerak" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" }, { status: 400 });
    }
    const existing = await UserService.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' }, { status: 409 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserService.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      status: status !== false,
    });
    const { password: _, ...rest } = user;
    return NextResponse.json({ user: rest }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
