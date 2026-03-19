import { NextRequest, NextResponse } from 'next/server';
import { TariffService, initializeDatabase } from '@/lib/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const tariff = await TariffService.findById(parseInt(id));
    if (!tariff) {
      return NextResponse.json({ error: 'Tarif topilmadi' }, { status: 404 });
    }
    return NextResponse.json(tariff, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const body = await request.json();
    const tariffId = parseInt(id);
    
    if (isNaN(tariffId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri tarif ID' }, { status: 400 });
    }
    
    const tariff = await TariffService.update(tariffId, body);
    if (!tariff) {
      return NextResponse.json({ error: 'Tarif topilmadi' }, { status: 404 });
    }
    return NextResponse.json(tariff, { status: 200 });
  } catch (error: any) {
    console.error('Tariff update error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const tariff = await TariffService.delete(parseInt(id));
    if (!tariff) {
      return NextResponse.json({ error: 'Tarif topilmadi' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Tarif o\'chirildi' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

