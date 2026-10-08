import { NextRequest, NextResponse } from 'next/server';
import { LessonFeedbackService, initializeDatabase } from '@/lib/postgres';
import { getAdminFromRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const SORTS = ['newest', 'oldest', 'rating_desc', 'rating_asc'] as const;
type Sort = (typeof SORTS)[number];

function intParam(value: string | null) {
  const n = parseInt(value || '', 10);
  return Number.isNaN(n) || n < 1 ? undefined : n;
}

function dateParam(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    if (!(await getAdminFromRequest(request))) {
      return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
    }
    const sp = new URL(request.url).searchParams;
    const sortRaw = sp.get('sort') as Sort | null;
    const rating = intParam(sp.get('rating'));

    const [list, lessons] = await Promise.all([
      LessonFeedbackService.adminList({
        lessonId: intParam(sp.get('lessonId')),
        sectionId: intParam(sp.get('sectionId')),
        rating: rating && rating <= 5 ? rating : undefined,
        search: sp.get('search') || undefined,
        from: dateParam(sp.get('from')),
        to: dateParam(sp.get('to')),
        sort: sortRaw && SORTS.includes(sortRaw) ? sortRaw : 'newest',
        page: intParam(sp.get('page')),
        pageSize: intParam(sp.get('pageSize')),
        all: sp.get('all') === '1',
      }),
      sp.get('summary') === '0' ? Promise.resolve(null) : LessonFeedbackService.lessonSummary(),
    ]);

    return NextResponse.json({ ...list, lessons });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}

/** Dars uchun fikr rejimini almashtirish: { lesson_id, feedback_mode } */
export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabase();
    if (!(await getAdminFromRequest(request))) {
      return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
    }
    const body = await request.json();
    const lessonId = parseInt(String(body.lesson_id ?? ''), 10);
    if (Number.isNaN(lessonId)) {
      return NextResponse.json({ error: "Noto'g'ri dars" }, { status: 400 });
    }
    const mode = body.feedback_mode === 'optional' ? 'optional' : 'required';
    const updated = await LessonFeedbackService.setMode(lessonId, mode);
    if (!updated) {
      return NextResponse.json({ error: 'Dars topilmadi' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}
