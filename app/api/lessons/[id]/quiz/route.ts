import { NextRequest, NextResponse } from 'next/server';
import {
  LessonFeedbackService,
  LessonProgressService,
  LessonService,
  TestSubmissionService,
  initializeDatabase,
} from '@/lib/postgres';
import { getTokenUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/** Dars uchun test manbasi (o'zi yoki ulangan dars). Savollar faqat dars 100% ko'rilgach beriladi. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const lessonId = parseInt(id, 10);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
    }

    const quiz = await LessonService.findQuizSourceForLesson(lessonId);
    if (!quiz || !quiz.questions?.length) {
      return NextResponse.json({ error: 'Test topilmadi' }, { status: 404 });
    }

    const tokenUser = getTokenUser(request);
    const isAdmin = tokenUser?.role === 'admin';
    const userId = tokenUser?.id ?? null;

    const progressPercent = userId ? await LessonProgressService.getPercent(userId, lessonId) : 0;
    const watched = progressPercent >= 100;
    const unlocked =
      isAdmin ||
      (userId != null &&
        ((watched && (await LessonFeedbackService.isSatisfied(userId, lessonId))) ||
          (await LessonProgressService.canTakeLessonQuiz(userId, quiz.sourceLesson.id))));

    const base = {
      lesson_id: quiz.sourceLesson.id,
      watch_lesson_id: lessonId,
      title: quiz.sourceLesson.title,
      section_id: quiz.sourceLesson.section_id,
      question_count: quiz.questions.length,
      progress_percent: isAdmin ? 100 : progressPercent,
    };

    if (!unlocked) {
      return NextResponse.json({
        ...base,
        locked: true,
        locked_reason: watched ? 'feedback' : 'progress',
        questions: [],
        attempt: null,
      });
    }

    const attempt = userId
      ? await TestSubmissionService.getAttemptStatus({
          user_id: userId,
          lesson_id: quiz.sourceLesson.id,
        })
      : null;

    return NextResponse.json({ ...base, locked: false, questions: quiz.questions, attempt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
