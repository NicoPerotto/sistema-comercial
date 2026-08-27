import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const users = await (prisma.user as any).findMany({
            include: {
                sales: {
                    include: {
                        items: true
                    }
                },
                shifts: {
                    orderBy: {
                        startTime: 'desc'
                    }
                }
            }
        });

        const stats = users.map((user: any) => {
            const completedSales = user.sales.filter((s: any) => s.status === 'COMPLETED');
            const cancelledSales = user.sales.filter((s: any) => s.status === 'CANCELLED');

            // Analyze audit logs for removals
            const salesWithRemovals = user.sales.filter((sale: any) => {
                if (!sale.auditLog) return false;
                try {
                    const log = JSON.parse(sale.auditLog);
                    return log.some((entry: any) => entry.action === 'REMOVE');
                } catch (e) {
                    return false;
                }
            }).length;

            const totalRevenue = completedSales.reduce((acc: number, sale: any) => acc + Number(sale.total), 0);

            return {
                id: user.id,
                name: user.name,
                role: user.role,
                stats: {
                    totalRevenue,
                    completedCount: completedSales.length,
                    cancelledCount: cancelledSales.length,
                    salesWithRemovals,
                    lastShift: user.shifts[0] || null
                }
            };
        });

        return NextResponse.json(stats);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, username, password, role, roleId } = body;

        if (!username) {
            return NextResponse.json({ error: 'El nombre de usuario es obligatorio' }, { status: 400 });
        }

        // Si se asigna un rol de la tabla Role, usar su slug como role y guardar roleId
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
                email,
                username,
                password: await bcrypt.hash(password, 10),
                role: resolvedRole,
                roleId: resolvedRoleId
            }
        });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, email, username, password, role, roleId } = body;

        const updateData: any = {
            name,
            email,
            username,
            role
        };

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

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
