import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }

  try {
    await initializeDatabase();
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (Number.isNaN(submissionId)) {
      return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
    }

    const deleted = await TestSubmissionService.delete(submissionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Natija topilmadi' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
