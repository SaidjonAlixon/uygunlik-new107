import { NextRequest, NextResponse } from 'next/server';
import { LessonService, initializeDatabase } from '@/lib/postgres';

export async function GET(
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
    
    const lessons = await LessonService.findAllByTariff(tariffId);
    return NextResponse.json(lessons, { status: 200 });
  } catch (error: any) {
    console.error('Lessons fetch error:', error);
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
    const { title, description, video_url, pdf_url, order_number, additional_resources } = body;

    if (!title) {
      return NextResponse.json({ error: 'title kerak' }, { status: 400 });
    }

    const lesson = await LessonService.create({
      tariff_id: tariffId,
      title,
      description,
      video_url,
      pdf_url,
      order_number: order_number || 0,
      additional_resources: additional_resources || [],
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error: any) {
    console.error('Lesson create error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

