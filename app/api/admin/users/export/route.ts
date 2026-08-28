import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { UserService, initializeDatabase } from '@/lib/postgres';
import { generateUsersExcel, usersExcelFilename } from '@/lib/users-excel';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }

  try {
    await initializeDatabase();
    const users = await UserService.findAllForExport();
    const buffer = await generateUsersExcel(users);
    const filename = usersExcelFilename();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('Users Excel export error:', e);
    return NextResponse.json({ error: 'Excel yaratishda xato' }, { status: 500 });
  }
}
