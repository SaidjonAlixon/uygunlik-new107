import { NextRequest, NextResponse } from 'next/server';
import {
  LessonFeedbackService,
  LessonProgressService,
  LessonService,
  initializeDatabase,
} from '@/lib/postgres';
import { getTokenUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const MIN_COMMENT = 3;
const MAX_COMMENT = 2000;

/** ?lessonId=X — shu dars bo‘yicha o‘z fikrim; parametrsiz — barcha darslar bo‘yicha xarita */
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const user = getTokenUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Avval tizimga kiring' }, { status: 401 });
    }
    const lessonId = parseInt(new URL(request.url).searchParams.get('lessonId') || '', 10);
    if (!Number.isNaN(lessonId) && lessonId > 0) {
      const feedback = await LessonFeedbackService.getMine(user.id, lessonId);
      return NextResponse.json({ feedback });
    }
    return NextResponse.json(await LessonFeedbackService.listMine(user.id));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const user = getTokenUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Avval tizimga kiring' }, { status: 401 });
    }
    const body = await request.json();
    const lessonId = parseInt(String(body.lesson_id ?? ''), 10);
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (Number.isNaN(lessonId) || lessonId < 1) {
      return NextResponse.json({ error: "Noto'g'ri dars" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Bahoni 1 dan 5 gacha yulduz bilan belgilang' }, { status: 400 });
    }
    if (comment.length < MIN_COMMENT) {
      return NextResponse.json({ error: 'Izohingizni yozing (kamida 3 ta belgi)' }, { status: 400 });
    }
    if (comment.length > MAX_COMMENT) {
      return NextResponse.json({ error: `Izoh ${MAX_COMMENT} belgidan oshmasin` }, { status: 400 });
    }

    const lesson = await LessonService.findById(lessonId);
    if (!lesson) {
      return NextResponse.json({ error: 'Dars topilmadi' }, { status: 404 });
    }
    if (user.role !== 'admin') {
      const percent = await LessonProgressService.getPercent(user.id, lessonId);
      if (percent < 100) {
        return NextResponse.json(
          { error: "Izoh qoldirish uchun avval darsni oxirigacha ko'ring" },
          { status: 403 }
        );
      }
    }

    const feedback = await LessonFeedbackService.upsert(user.id, lessonId, rating, comment);
    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}
