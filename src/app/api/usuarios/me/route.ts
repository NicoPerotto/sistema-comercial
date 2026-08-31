import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    const token = match ? match[1] : null;
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

    const body = await req.json();
    const { name, email, username, password } = body;

    if (!username) {
      return NextResponse.json({ error: 'El nombre de usuario es obligatorio' }, { status: 400 });
    }

    const updateData: any = {
      name,
      email: email || null,
      username,
    };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, username: user.username });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
