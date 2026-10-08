import { NextRequest, NextResponse } from 'next/server';
import { LessonProgressService, initializeDatabase } from '@/lib/postgres';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

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

    const lessonId = parseInt(searchParams.get('lessonId') || '', 10);
    if (!Number.isNaN(lessonId) && lessonId > 0) {
      const state = await LessonProgressService.getState(userId, lessonId);
      return NextResponse.json(state, { status: 200 });
    }

    const tariffId = searchParams.get('tariffId');
    if (!tariffId || Number.isNaN(parseInt(tariffId, 10))) {
      return NextResponse.json({ error: 'tariffId yoki lessonId kerak' }, { status: 400 });
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
    if (Number.isNaN(lessonId) || lessonId < 1) {
      return NextResponse.json({ error: 'Noto\'g\'ri lesson_id' }, { status: 400 });
    }

    // Eski mijozlar faqat foiz yuborardi — endi foiz faqat ko‘rilgan soniyalardan hisoblanadi
    if (!Array.isArray(body.watched_ranges)) {
      const state = await LessonProgressService.getState(userId, lessonId);
      return NextResponse.json(state, { status: 200 });
    }

    const duration = Number(body.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: 'duration kerak' }, { status: 400 });
    }

    const result = await LessonProgressService.saveWatch(
      userId,
      lessonId,
      body.watched_ranges,
      duration,
      Number(body.position)
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}
