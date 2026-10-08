import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { initializeDatabase } from '@/lib/postgres';

/** Token egasi (har qanday rol). Token yo'q yoki yaroqsiz bo'lsa null. */
export function getTokenUser(request: NextRequest): { id: number; role?: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const decoded = verifyToken(authHeader.slice(7)) as { id: number | string; role?: string };
    const id = typeof decoded?.id === 'string' ? parseInt(decoded.id, 10) : decoded?.id;
    if (!id || Number.isNaN(id)) return null;
    return { id, role: decoded.role };
  } catch {
    return null;
  }
}

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
