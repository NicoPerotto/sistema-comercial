import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const activeRegister = await (prisma as any).cashRegister.findFirst({
            where: { status: 'OPEN' },
            include: {
                openedBy: { select: { name: true } },
                sales: { include: { paymentMethod: true } }
            }
        });

        if (activeRegister) {
            return NextResponse.json(activeRegister);
        }

        // If no active, find the last closed one to suggest opening amount
        const lastClosed = await (prisma as any).cashRegister.findFirst({
            where: { status: 'CLOSED' },
            orderBy: { closedAt: 'desc' }
        });

        return NextResponse.json({
            status: 'CLOSED',
            suggestedOpeningAmount: lastClosed ? Number(lastClosed.openingAmount) : 0
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
