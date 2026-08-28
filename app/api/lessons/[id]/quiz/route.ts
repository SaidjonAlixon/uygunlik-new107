import { NextRequest, NextResponse } from 'next/server';
import { LessonService, TestSubmissionService, initializeDatabase } from '@/lib/postgres';

/** Dars uchun test manbasi (o'zi yoki ulangan dars) */
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

    const userId = Number(new URL(request.url).searchParams.get('user_id'));
    let attempt = null;
    if (userId) {
      attempt = await TestSubmissionService.getAttemptStatus({
        user_id: userId,
        lesson_id: quiz.sourceLesson.id,
      });
    }

    return NextResponse.json({
      lesson_id: quiz.sourceLesson.id,
      title: quiz.sourceLesson.title,
      section_id: quiz.sourceLesson.section_id,
      questions: quiz.questions,
      attempt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
