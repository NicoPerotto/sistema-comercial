import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const users = await (prisma.user as any).findMany({
            include: {
                roleRef: true,
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
                roleId: user.roleId,
                showInEmployees: user.roleRef?.showInEmployees ?? false,
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
