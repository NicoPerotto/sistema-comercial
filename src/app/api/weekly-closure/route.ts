import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

function generateShortId() {
    return 'W-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, startDate, endDate, breakdown, totalExpected, totalReal, difference } = body;

        if (!userId || !startDate || !endDate || !breakdown) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const shortId = generateShortId();

        // 1. Create WeeklyClosure
        const closure = await (prisma as any).weeklyClosure.create({
            data: {
                shortId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                totalExpected: parseFloat(totalExpected),
                totalReal: parseFloat(totalReal),
                difference: parseFloat(difference),
                userId,
                details: {
                    create: breakdown.map((b: any) => ({
                        paymentMethodId: b.paymentMethodId,
                        expectedAmount: Number(b.expectedTotal),
                        realAmount: Number(b.realAmount),
                        difference: Number(b.realAmount) - Number(b.expectedTotal)
                    }))
                }
            },
            include: {
                details: {
                    include: { paymentMethod: true }
                },
                user: { select: { name: true } }
            }
        });

        return NextResponse.json(closure);
    } catch (error: any) {
        console.error('API Error WeeklyClosure POST:', error);
        return NextResponse.json({ error: error.message || 'Error al procesar cierre semanal' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const closures = await (prisma as any).weeklyClosure.findMany({
            include: {
                details: {
                    include: { paymentMethod: true }
                },
                user: { select: { name: true } }
            },
            orderBy: { endDate: 'desc' }
        });
        return NextResponse.json(closures);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
