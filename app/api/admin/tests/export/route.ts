import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';
import { generateTestsExcel, type DetailedSubmission } from '@/lib/telegram';
import { formatTashkentDate } from '@/lib/datetime';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }

  try {
    await initializeDatabase();
    const submissions = await TestSubmissionService.findAllDetailed();
    const buffer = await generateTestsExcel(submissions as DetailedSubmission[]);
    const dateLabel = formatTashkentDate(new Date()).replace(/\./g, '-');
    const filename = `test-natijalari-${dateLabel}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('Tests Excel export error:', e);
    return NextResponse.json({ error: 'Excel yaratishda xato' }, { status: 500 });
  }
}
