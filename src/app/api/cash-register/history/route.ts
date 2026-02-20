import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const history = await (prisma as any).cashRegister.findMany({
            where: { status: 'CLOSED' },
            orderBy: { closedAt: 'desc' },
            include: {
                openedBy: { select: { name: true } },
                closedBy: { select: { name: true } },
                sales: {
                    where: { status: 'COMPLETED' },
                    include: { paymentMethod: true }
                }
            },
            take: 20 // Limit to last 20 sessions for now
        });

        // Calculate breakdown for each session in history
        const historyWithBreakdown = history.map((session: any) => {
            const breakdown: Record<string, number> = {};
            session.sales.forEach((sale: any) => {
                const methodName = sale.paymentMethod?.name || 'Efectivo';
                breakdown[methodName] = (breakdown[methodName] || 0) + Number(sale.total);
            });

            // Remove sales from the response to keep it light
            const { sales, ...sessionData } = session;
            return {
                ...sessionData,
                breakdown
            };
        });

        return NextResponse.json(historyWithBreakdown);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
