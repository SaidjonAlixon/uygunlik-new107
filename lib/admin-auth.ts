import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { initializeDatabase } from '@/lib/postgres';

/** Admin bo'lgan foydalanuvchini request dan oladi. Token va role tekshiriladi. */
export async function getAdminFromRequest(request: NextRequest): Promise<{ id: number; email: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const decoded = verifyToken(token) as { id: number; email: string; role?: string };
    if (!decoded?.id || decoded.role !== 'admin') return null;

    await initializeDatabase();
    return { id: decoded.id, email: decoded.email };
  } catch (error) {
    console.error('getAdminFromRequest: Error', error);
    return null;
  }
}
