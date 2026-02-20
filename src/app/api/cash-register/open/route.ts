import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

function generateShortId() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export async function POST(request: Request) {
    try {
        const { openingAmount, openedById } = await request.json();

        // Check if there is already an open register
        const activeRegister = await (prisma as any).cashRegister.findFirst({
            where: { status: 'OPEN' }
        });

        if (activeRegister) {
            return NextResponse.json({ error: 'Ya existe una caja abierta' }, { status: 400 });
        }

        const shortId = generateShortId();

        const newRegister = await (prisma as any).cashRegister.create({
            data: {
                shortId,
                openingAmount: parseFloat(openingAmount),
                openedById,
                status: 'OPEN'
            }
        });

        return NextResponse.json(newRegister);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
