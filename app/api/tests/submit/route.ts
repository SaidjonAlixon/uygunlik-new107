import { NextRequest, NextResponse } from 'next/server';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';
import { notifyTelegramTestSubmission } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { user_id, lesson_id, score, total_questions, answers } = body;

    if (!user_id || !lesson_id || score === undefined || !total_questions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const submission = await TestSubmissionService.create({
      user_id,
      lesson_id,
      score,
      total_questions,
      answers
    });

    notifyTelegramTestSubmission(submission.id).catch((err) => {
      console.error('Telegram notify failed:', err);
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Test submission error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
