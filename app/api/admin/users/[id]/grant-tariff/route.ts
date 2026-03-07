import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { UserService, initializeDatabase } from '@/lib/postgres';

export async function POST(
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
    const tariffId = body.tariffId != null ? parseInt(String(body.tariffId), 10) : null;
    if (tariffId != null && Number.isNaN(tariffId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri ta\'rif ID' }, { status: 400 });
    }
    const user = await UserService.update(id, { tariff_id: tariffId ?? undefined });
    if (!user) return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    const { password: _, ...rest } = user;
    return NextResponse.json({ user: rest });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
