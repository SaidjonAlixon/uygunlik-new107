import { NextRequest, NextResponse } from 'next/server';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
    }

    const updated = await TestSubmissionService.allowRetake(submissionId);
    if (!updated) {
      return NextResponse.json({ error: 'Natija topilmadi' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
