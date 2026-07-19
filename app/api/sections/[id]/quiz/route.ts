import { NextRequest, NextResponse } from 'next/server';
import { SectionService, TestSubmissionService, initializeDatabase } from '@/lib/postgres';

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

    const userId = Number(new URL(request.url).searchParams.get('user_id'));
    let attempt = null;
    if (userId) {
      attempt = await TestSubmissionService.getAttemptStatus({
        user_id: userId,
        section_id: sectionId,
      });
    }

    return NextResponse.json({
      section_id: section.id,
      title: section.name,
      questions,
      attempt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
