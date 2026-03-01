import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

function generateShortId() {
    return 'PAY-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

export async function GET() {
    try {
        const payments = await (prisma as any).supplierPayment.findMany({
            include: {
                supplier: true,
                paymentMethod: true,
                cashRegister: {
                    select: { shortId: true }
                },
                user: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(payments);
    } catch (error: any) {
        console.error('API Error SupplierPayments GET:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { supplierId, amount, paymentMethodId, description, userId, paidFromCash, cashRegisterShortId } = body;

        if (!supplierId || !amount || !paymentMethodId || !userId) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        let finalRegisterId = undefined;
        const isFinalPaidFromCash = !!paidFromCash;

        if (isFinalPaidFromCash) {
            // Priority 1: Use active register automatically
            const activeRegister = await (prisma as any).cashRegister.findFirst({
                where: { status: 'OPEN' }
            });
            if (activeRegister) finalRegisterId = activeRegister.id;
        } else if (cashRegisterShortId) {
            // Priority 2: Use specific historical register if code provided (Vault mode)
            const specifiedRegister = await (prisma as any).cashRegister.findFirst({
                where: { shortId: cashRegisterShortId.toUpperCase() }
            });
            if (specifiedRegister) finalRegisterId = specifiedRegister.id;
        }

        const shortId = generateShortId();

        const payment = await (prisma as any).supplierPayment.create({
            data: {
                shortId,
                amount: parseFloat(amount),
                description: description || null,
                supplier: { connect: { id: supplierId } },
                paymentMethod: { connect: { id: paymentMethodId } },
                user: { connect: { id: userId } },
                cashRegister: finalRegisterId ? { connect: { id: finalRegisterId } } : undefined
            },
            include: {
                supplier: true,
                paymentMethod: true,
                cashRegister: { select: { shortId: true } }
            }
        });

        // Use Raw SQL for paidFromCash status
        await prisma.$executeRawUnsafe(
            `UPDATE SupplierPayment SET paidFromCash = ? WHERE id = ?`,
            isFinalPaidFromCash ? 1 : 0, payment.id
        );

        return NextResponse.json({ ...payment, paidFromCash: isFinalPaidFromCash });
    } catch (error: any) {
        console.error('API Error SupplierPayments POST:', error);
        return NextResponse.json({ error: error.message || 'Error al procesar pago' }, { status: 500 });
    }
}
