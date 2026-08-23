import { SignJWT, jwtVerify } from 'jose';

/**
 * Sesión firmada (JWT HS256) en cookie httpOnly.
 * Reemplaza la cookie anterior `user_session` que guardaba el usuario en
 * texto plano (falsificable). Ahora el payload viaja firmado y verificable.
 */

const COOKIE_NAME = 'user_session';
const MAX_AGE_SECONDS = 60 * 60 * 24; // 1 día

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    // En dev sin AUTH_SECRET usamos un fallback estable para poder probar.
    // En producción SIEMPRE debe estar AUTH_SECRET configurado en Vercel.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET no está configurado en producción');
    }
    return new TextEncoder().encode('dev-only-insecure-secret-change-me');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function signSession(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
