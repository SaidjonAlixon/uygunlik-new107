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
    const section = await SectionService.update(sectionId, body);

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
