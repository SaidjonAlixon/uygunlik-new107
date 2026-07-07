import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { TariffService, initializeDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const tariffs = await TariffService.findAll();
    return NextResponse.json(tariffs);
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
    const { name, description, price } = body;
    if (!name || price == null) {
      return NextResponse.json({ error: 'Nomi va narx to\'ldirilishi kerak' }, { status: 400 });
    }
    const tariff = await TariffService.create({
      name: String(name).trim(),
      description: body.description ? String(body.description) : '',
      price: Number(price),
    });
    return NextResponse.json(tariff, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
