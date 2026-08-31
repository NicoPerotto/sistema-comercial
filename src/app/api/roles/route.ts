import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { APP_WINDOWS } from '@/lib/windows';

interface Permissions {
  windows: string[];
}

function parsePermissions(raw: string): Permissions {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.windows)) {
      // Validar contra el catálogo conocido para evitar paths inventados
      const valid = new Set(APP_WINDOWS.map((w) => w.path));
      return { windows: parsed.windows.filter((p: string) => valid.has(p)) };
    }
  } catch {
    // ignore
  }
  return { windows: [] };
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const roles = await prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { users: true } } },
    });

    const data = roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      showInEmployees: r.showInEmployees,
      userCount: r._count.users,
      permissions: parsePermissions(r.permissions),
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
    const { name, slug, description, windows, showInEmployees } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 });
    }

    const valid = new Set(APP_WINDOWS.map((w) => w.path));
    const cleanWindows = Array.isArray(windows) ? windows.filter((w: string) => valid.has(w)) : [];

    const role = await prisma.role.create({
      data: {
        name: String(name),
        slug: String(slug).toUpperCase(),
        description: description ? String(description) : null,
        showInEmployees: Boolean(showInEmployees),
        permissions: JSON.stringify({ windows: cleanWindows }),
      },
    });

    return NextResponse.json({ ...role, permissions: { windows: cleanWindows } }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un rol con ese nombre o slug' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const { id, name, slug, description, windows, showInEmployees } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }
    if (existing.isSystem) {
      return NextResponse.json({ error: 'Los roles del sistema no se pueden editar' }, { status: 403 });
    }

    const valid = new Set(APP_WINDOWS.map((w) => w.path));
    const cleanWindows = Array.isArray(windows) ? windows.filter((w: string) => valid.has(w)) : [];

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug: slug ? String(slug).toUpperCase() : existing.slug,
        description: description !== undefined ? (description ? String(description) : null) : existing.description,
        showInEmployees: showInEmployees !== undefined ? Boolean(showInEmployees) : existing.showInEmployees,
        permissions: JSON.stringify({ windows: cleanWindows }),
      },
    });

    return NextResponse.json({ ...role, permissions: { windows: cleanWindows } });
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

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }
    if (existing.isSystem) {
      return NextResponse.json({ error: 'Los roles del sistema no se pueden eliminar' }, { status: 403 });
    }

    // Los usuarios que usaban este rol vuelven a quedar sin roleId (rol implícito por `role` String)
    await prisma.user.updateMany({
      where: { roleId: id },
      data: { roleId: null },
    });

    await prisma.role.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
