import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/postgres';
import { initializeDatabase } from '@/lib/postgres';

export async function GET() {
  try {
    await initializeDatabase();
    const result = await CourseService.findAll();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { title, description, price, category, videos } = body;

    if (!title || price === undefined) {
      return NextResponse.json({ error: 'title va price kerak' }, { status: 400 });
    }

    const course = await CourseService.create({
      title,
      description,
      price,
      category: Array.isArray(category) ? category : [],
      videos: Array.isArray(videos) ? videos : [],
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
