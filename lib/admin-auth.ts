import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { UserService, initializeDatabase } from '@/lib/postgres';

/** Admin bo'lgan foydalanuvchini request dan oladi. Token va role tekshiriladi. */
export async function getAdminFromRequest(request: NextRequest): Promise<{ id: number; email: string } | null> {
  try {
    await initializeDatabase();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const decoded = verifyToken(token) as { id: number; email: string };
    const user = await UserService.findById(decoded.id);
    if (!user || user.role !== 'admin') return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}
