import { NextRequest, NextResponse } from 'next/server';
import { SectionService, initializeDatabase } from '@/lib/postgres';

export async function GET() {
  try {
    await initializeDatabase();
    const sections = await SectionService.findAll();
    return NextResponse.json(sections, { status: 200 });
  } catch (error: any) {
    console.error('Sections list error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { name, description, order_number, tariff_ids } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Bo'lim nomi kerak" }, { status: 400 });
    }

    const ids = Array.isArray(tariff_ids)
      ? tariff_ids.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
      : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Kamida bitta tarif tanlanishi kerak" },
        { status: 400 }
      );
    }

    const section = await SectionService.create({
      tariff_id: ids[0],
      name: name.trim(),
      description: description?.trim() || '',
      order_number: order_number || 0,
      tariff_ids: ids,
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error: any) {
    console.error('Section create error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
