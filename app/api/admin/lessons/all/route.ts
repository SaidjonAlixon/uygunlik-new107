import { NextRequest, NextResponse } from 'next/server';
import { LessonService, initializeDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const lessons = await LessonService.findAllWithTariff();
    return NextResponse.json(lessons, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
