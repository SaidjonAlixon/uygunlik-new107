import { NextRequest, NextResponse } from 'next/server';
import { TariffService, initializeDatabase } from '@/lib/postgres';

export async function GET() {
  try {
    await initializeDatabase();
    const tariffs = await TariffService.findAll();
    return NextResponse.json(tariffs, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { name, description, price } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'name va price kerak' }, { status: 400 });
    }

    try {
      const tariff = await TariffService.create({
        name,
        description,
        price: Number(price),
      });
      return NextResponse.json(tariff, { status: 201 });
    } catch (err: any) {
      // Handle unique constraint violation (duplicate name)
      if (err?.code === '23505') {
        return NextResponse.json({ error: 'Bu nom bilan tarif allaqachon mavjud' }, { status: 409 });
      }
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

