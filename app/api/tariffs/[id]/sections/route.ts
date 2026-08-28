import { NextRequest, NextResponse } from 'next/server';
import { SectionService, initializeDatabase } from '@/lib/postgres';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const tariffId = parseInt(id);

    if (isNaN(tariffId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri tarif ID' }, { status: 400 });
    }

    const sections = await SectionService.findAllWithLessonsByTariff(tariffId);
    return NextResponse.json(sections, { status: 200 });
  } catch (error: any) {
    console.error('Sections fetch error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const tariffId = parseInt(id);

    if (isNaN(tariffId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri tarif ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, order_number, tariff_ids } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Bo\'lim nomi kerak' }, { status: 400 });
    }

    const extraTariffIds = Array.isArray(tariff_ids)
      ? tariff_ids.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
      : [];

    const section = await SectionService.create({
      tariff_id: tariffId,
      name: name.trim(),
      description: description?.trim() || '',
      order_number: order_number || 0,
      tariff_ids: extraTariffIds.length > 0 ? extraTariffIds : [tariffId],
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error: any) {
    console.error('Section create error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
