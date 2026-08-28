import { NextRequest, NextResponse } from 'next/server';
import { SectionService, initializeDatabase } from '@/lib/postgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const sectionId = parseInt(id);

    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri bo\'lim ID' }, { status: 400 });
    }

    const body = await request.json();
    const updates: {
      name?: string;
      description?: string;
      order_number?: number;
      tariff_ids?: number[];
      test_questions?: any[];
    } = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.order_number !== undefined) updates.order_number = Number(body.order_number);
    if (body.test_questions !== undefined) updates.test_questions = body.test_questions;
    if (Array.isArray(body.tariff_ids)) {
      updates.tariff_ids = body.tariff_ids
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isFinite(id) && id > 0);
      if (updates.tariff_ids.length === 0) {
        return NextResponse.json(
          { error: "Bo'lim uchun kamida bitta tarif tanlanishi kerak" },
          { status: 400 }
        );
      }
    }

    const section = await SectionService.update(sectionId, updates);

    if (!section) {
      return NextResponse.json({ error: 'Bo\'lim topilmadi' }, { status: 404 });
    }

    return NextResponse.json(section, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const sectionId = parseInt(id);

    if (isNaN(sectionId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri bo\'lim ID' }, { status: 400 });
    }

    const section = await SectionService.delete(sectionId);

    if (!section) {
      return NextResponse.json({ error: 'Bo\'lim topilmadi' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bo\'lim o\'chirildi' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
