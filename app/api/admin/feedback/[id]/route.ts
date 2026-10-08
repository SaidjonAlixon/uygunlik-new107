import { NextRequest, NextResponse } from 'next/server';
import { LessonFeedbackService, initializeDatabase } from '@/lib/postgres';
import { getAdminFromRequest } from '@/lib/admin-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    if (!(await getAdminFromRequest(request))) {
      return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
    }
    const { id } = await params;
    const removed = await LessonFeedbackService.remove(parseInt(id, 10));
    if (!removed) {
      return NextResponse.json({ error: 'Fikr topilmadi' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server xatoligi' }, { status: 500 });
  }
}
