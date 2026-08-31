import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const users = await (prisma.user as any).findMany({
      orderBy: { createdAt: 'asc' },
      include: { roleRef: true },
    });

    const data = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      roleId: u.roleId,
      roleName: u.roleRef?.name || null,
      lastSession: u.lastSession,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const { name, email, username, password, role, roleId } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
    }

    let resolvedRole = role || 'VENDEDOR';
    let resolvedRoleId: string | null = roleId || null;
    if (roleId) {
      const found = await prisma.role.findUnique({ where: { id: roleId } });
      if (found) {
        resolvedRole = found.slug;
        resolvedRoleId = found.id;
      } else {
        resolvedRoleId = null;
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email && email.trim() ? email : `${username}@sistema.local`,
        username,
        password: await bcrypt.hash(password, 10),
        role: resolvedRole,
        roleId: resolvedRoleId,
      },
    });

    return NextResponse.json({ ...user, password: undefined }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const { id, name, email, username, password, role, roleId } = body;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updateData: any = { name, email: email && email.trim() ? email : `${username}@sistema.local`, username, role };
    if (roleId) {
      const found = await prisma.role.findUnique({ where: { id: roleId } });
      if (found) {
        updateData.role = found.slug;
        updateData.roleId = found.id;
      } else {
        updateData.roleId = null;
      }
    } else if (roleId === '' || roleId === null) {
      updateData.roleId = null;
    }
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({ where: { id }, data: updateData });
    return NextResponse.json({ ...user, password: undefined });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
