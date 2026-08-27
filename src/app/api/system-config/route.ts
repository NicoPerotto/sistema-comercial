import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { isValidTheme } from '@/lib/system-config';

const DEFAULTS = {
  brandName: 'PPG Gestión Comercial',
  description: 'Sistema avanzado de gestión comercial, stock y ventas',
  sidebarTitle: 'PPG',
  sidebarSubtitle: 'Gestión Comercial',
  theme: 'warm-sand',
};

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const record = await prisma.systemConfig.findFirst();
    if (!record) return NextResponse.json(DEFAULTS);
    return NextResponse.json(record);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const data: Record<string, string> = {};

    if (body.brandName !== undefined) data.brandName = String(body.brandName);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.sidebarTitle !== undefined) data.sidebarTitle = String(body.sidebarTitle);
    if (body.sidebarSubtitle !== undefined) data.sidebarSubtitle = String(body.sidebarSubtitle);

    if (body.theme !== undefined) {
      if (!isValidTheme(body.theme)) {
        return NextResponse.json(
          { error: 'Tema inválido. Elegí uno de la lista de temas disponibles.' },
          { status: 400 },
        );
      }
      data.theme = String(body.theme);
    }

    const existing = await prisma.systemConfig.findFirst();
    let config;
    if (!existing) {
      config = await prisma.systemConfig.create({ data });
    } else {
      config = await prisma.systemConfig.update({ where: { id: existing.id }, data });
    }
    return NextResponse.json(config);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
