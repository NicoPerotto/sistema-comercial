import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Lee y verifica la cookie de sesión firmada en una Route Handler (server side).
 * Devuelve el usuario o null si no hay sesión válida.
 */
export async function getServerUser(req: NextRequest): Promise<ServerUser | null> {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match ? match[1] : null;
  if (!token) return null;
  const user = await verifySession(token);
  return user as ServerUser | null;
}

/**
 * Protege una route: requiere sesión válida Y rol ADMIN.
 * Devuelve { user } si OK, o una NextResponse de error lista para retornar.
 */
export async function requireAdmin(req: NextRequest): Promise<
  { user: ServerUser; error: null } | { user: null; error: NextResponse }
> {
  const user = await getServerUser(req);
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (user.role !== 'ADMIN') {
    return { user: null, error: NextResponse.json({ error: 'Acceso denegado: se requiere rol ADMIN' }, { status: 403 }) };
  }
  return { user, error: null };
}
