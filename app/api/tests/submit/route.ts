import { NextRequest, NextResponse } from 'next/server';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';
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
