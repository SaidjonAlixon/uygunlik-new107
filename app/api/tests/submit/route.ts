import { NextRequest, NextResponse } from 'next/server';
import { LessonProgressService, TestSubmissionService, initializeDatabase } from '@/lib/postgres';
import { getTokenUser } from '@/lib/admin-auth';
import { notifyTelegramTestSubmission } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { user_id, lesson_id, section_id, score, total_questions, answers } = body;

    if (!user_id || score === undefined || !total_questions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!lesson_id && !section_id) {
      return NextResponse.json({ error: 'lesson_id yoki section_id kerak' }, { status: 400 });
    }

    const tokenUser = getTokenUser(request);
    if (tokenUser?.role !== 'admin') {
      const uid = Number(user_id);
      const unlocked = section_id
        ? (await LessonProgressService.getSectionStatus(uid, Number(section_id))).remaining === 0
        : await LessonProgressService.canTakeLessonQuiz(uid, Number(lesson_id));
      if (!unlocked) {
        return NextResponse.json(
          { error: "Test hali ochilmagan: avval darslarni 100% ko'ring va majburiy fikrlarni qoldiring" },
          { status: 403 }
        );
      }
    }

    const submission = await TestSubmissionService.create({
      user_id,
      lesson_id: lesson_id || null,
      section_id: section_id || null,
      score,
      total_questions,
      answers: answers || [],
    });

    try {
      await notifyTelegramTestSubmission(submission.id);
    } catch (err) {
      console.error('Telegram notify failed:', err);
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Test submission error:', error);
    const msg = error.message || 'Server error';
    const status = msg.includes('allaqachon') || msg.includes('ruxsat') ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
