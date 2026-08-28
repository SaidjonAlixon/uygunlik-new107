import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { UserService, initializeDatabase } from '@/lib/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const id = parseInt((await params).id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 });
    }
    const user = await UserService.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }
    const { password: _, ...rest } = user;
    return NextResponse.json({ user: rest });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const id = parseInt((await params).id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 });
    }
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.first_name != null) updates.first_name = body.first_name;
    if (body.last_name != null) updates.last_name = body.last_name;
    if (body.email != null) updates.email = body.email;
    if (body.role != null) updates.role = body.role === 'admin' ? 'admin' : 'user';
    if (body.status != null) updates.status = !!body.status;
    if (body.tariff_id != null) updates.tariff_id = body.tariff_id === '' || body.tariff_id == null ? null : Number(body.tariff_id);
    if (body.password != null && body.password !== '') {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" }, { status: 400 });
      }
      updates.password = await bcrypt.hash(body.password, 10);
    }
    if (Object.keys(updates).length === 0) {
      const user = await UserService.findById(id);
      if (!user) return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
      const { password: _, ...rest } = user;
      return NextResponse.json({ user: rest });
    }
    const user = await UserService.update(id, updates as Parameters<typeof UserService.update>[1]);
    if (!user) return NextResponse.json({ error: 'Yangilanmadi' }, { status: 500 });
    const { password: _, ...rest } = user;
    return NextResponse.json({ user: rest });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const id = parseInt((await params).id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ID' }, { status: 400 });
    }
    const deleted = await UserService.delete(id);
    if (!deleted) return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
