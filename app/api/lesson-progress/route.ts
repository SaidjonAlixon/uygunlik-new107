import { NextRequest, NextResponse } from 'next/server';
import { LessonProgressService, initializeDatabase } from '@/lib/postgres';
import { verifyToken } from '@/lib/jwt';

function getUserId(request: NextRequest): number | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded: any = verifyToken(authHeader.substring(7));
    const userId = typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : decoded.id;
    return Number.isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authorization token kerak' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const tariffId = searchParams.get('tariffId');
    if (!tariffId || Number.isNaN(parseInt(tariffId, 10))) {
      return NextResponse.json({ error: 'tariffId kerak' }, { status: 400 });
    }
    const progress = await LessonProgressService.getByUserAndTariff(userId, parseInt(tariffId, 10));
    return NextResponse.json(progress, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authorization token kerak' }, { status: 401 });
    }
    const body = await request.json();
    const lessonId = body.lesson_id != null ? parseInt(String(body.lesson_id), 10) : NaN;
    const progressPercent = body.progress_percent != null ? Number(body.progress_percent) : NaN;
    if (Number.isNaN(lessonId) || lessonId < 1) {
      return NextResponse.json({ error: 'Noto\'g\'ri lesson_id' }, { status: 400 });
    }
    if (Number.isNaN(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return NextResponse.json({ error: 'progress_percent 0–100 orasida bo\'lishi kerak' }, { status: 400 });
    }
    const result = await LessonProgressService.upsert(userId, lessonId, progressPercent);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}
