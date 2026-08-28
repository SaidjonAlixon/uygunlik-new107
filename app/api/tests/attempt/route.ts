import { NextRequest, NextResponse } from 'next/server';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

/** GET /api/tests/attempt?user_id=&lesson_id= | section_id= */
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get('user_id'));
    const lessonId = searchParams.get('lesson_id');
    const sectionId = searchParams.get('section_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id kerak' }, { status: 400 });
    }

    const status = await TestSubmissionService.getAttemptStatus({
      user_id: userId,
      lesson_id: lessonId ? Number(lessonId) : null,
      section_id: sectionId ? Number(sectionId) : null,
    });

    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
