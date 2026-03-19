import { NextRequest, NextResponse } from 'next/server';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';
import { getServerSession } from 'next-auth';
// Admin authorizatsiyasi emas, foydalanuvchi sessioni kerak bo'lishi mumkin, 
// lekin hozircha oddiyroq yo'l bilan user_id ni body'dan olsak bo'ladi (yoki session'dan)
// Bu loyihada custom auth ishlatilgan bo'lishi mumkin.

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

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Test submission error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
