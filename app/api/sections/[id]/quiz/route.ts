import { NextRequest, NextResponse } from 'next/server';
import { LessonProgressService, SectionService, TestSubmissionService, initializeDatabase } from '@/lib/postgres';
import { getTokenUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/** Bo'lim testi — savollar faqat bo'limdagi barcha darslar 100% ko'rilgach beriladi */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
    }

    const section = await SectionService.findById(sectionId);
    if (!section) {
      return NextResponse.json({ error: "Bo'lim topilmadi" }, { status: 404 });
    }

    const questions = typeof section.test_questions === 'string'
      ? JSON.parse(section.test_questions || '[]')
      : (section.test_questions || []);

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Bo'lim testi yo'q" }, { status: 404 });
    }

    const tokenUser = getTokenUser(request);
    const isAdmin = tokenUser?.role === 'admin';
    const userId = tokenUser?.id ?? null;
    const status = userId
      ? await LessonProgressService.getSectionStatus(userId, sectionId)
      : { total: 0, completed: 0, remaining: 0, feedbackMissing: 0, percent: 0 };
    const unlocked = isAdmin || (userId != null && status.remaining === 0);

    const base = {
      section_id: section.id,
      title: section.name,
      question_count: questions.length,
      lessons_total: status.total,
      lessons_completed: status.completed,
      lessons_remaining: isAdmin ? 0 : userId ? status.remaining : null,
      feedback_missing: isAdmin ? 0 : status.feedbackMissing,
      progress_percent: isAdmin ? 100 : status.percent,
    };

    if (!unlocked) {
      return NextResponse.json({ ...base, locked: true, questions: [], attempt: null });
    }

    const attempt = userId
      ? await TestSubmissionService.getAttemptStatus({ user_id: userId, section_id: sectionId })
      : null;

    return NextResponse.json({ ...base, locked: false, questions, attempt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
