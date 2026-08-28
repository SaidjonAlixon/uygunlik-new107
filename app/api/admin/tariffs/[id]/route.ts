import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { TariffService, initializeDatabase } from '@/lib/postgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const { id } = await params;
    const tariffId = parseInt(id, 10);
    if (isNaN(tariffId)) {
      return NextResponse.json({ error: "Noto'g'ri ta'rif ID" }, { status: 400 });
    }
    const body = await request.json();
    const updates: { name?: string; description?: string; price?: number } = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.price !== undefined) updates.price = Number(body.price);
    const tariff = await TariffService.update(tariffId, updates);
    if (!tariff) {
      return NextResponse.json({ error: "Ta'rif topilmadi" }, { status: 404 });
    }
    return NextResponse.json(tariff);
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
    const { id } = await params;
    const tariffId = parseInt(id, 10);
    if (isNaN(tariffId)) {
      return NextResponse.json({ error: "Noto'g'ri ta'rif ID" }, { status: 400 });
    }
    const tariff = await TariffService.delete(tariffId);
    if (!tariff) {
      return NextResponse.json({ error: "Ta'rif topilmadi" }, { status: 404 });
    }
    return NextResponse.json({ message: "Ta'rif o'chirildi" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
