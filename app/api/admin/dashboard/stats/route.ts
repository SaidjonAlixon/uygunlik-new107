import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { UserService, TariffService, initializeDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin huquqi kerak' }, { status: 403 });
  }
  try {
    await initializeDatabase();
    const [usersResult, tariffsResult] = await Promise.all([
      UserService.findAll(1, 1, ''),
      TariffService.findAll(),
    ]);
    const usersCount = usersResult.total;
    const activeTariffsCount = tariffsResult.filter((t: { id: number }) => t.id).length;
    const usersWithTariff = usersResult.data.filter((u: { tariff_id: number | null }) => u.tariff_id != null).length;
    return NextResponse.json({
      usersCount,
      activeTariffsCount,
      pendingPayments: 0,
      todayRevenue: 0,
      usersWithTariff,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
