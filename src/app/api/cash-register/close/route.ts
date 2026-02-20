import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { closingAmount, closedById } = await request.json();

        // 1. Find active register with sales and payment method info
        const activeRegister = await (prisma as any).cashRegister.findFirst({
            where: { status: 'OPEN' },
            include: {
                sales: {
                    where: { status: 'COMPLETED' },
                    include: { paymentMethod: true }
                }
            }
        });

        if (!activeRegister) {
            return NextResponse.json({ error: 'No hay una caja abierta para cerrar' }, { status: 400 });
        }

        // 2. Separate arqueable vs and get breakdown
        const breakdown: Record<string, number> = {};
        let arqueableTotal = 0;

        activeRegister.sales.forEach((sale: any) => {
            const methodName = sale.paymentMethod?.name || 'Efectivo';
            const isArqueable = sale.paymentMethod ? sale.paymentMethod.isArqueable : true; // Default to true if no method (cash)

            breakdown[methodName] = (breakdown[methodName] || 0) + Number(sale.total);

            if (isArqueable) {
                arqueableTotal += Number(sale.total);
            }
        });

        const openingAmount = Number(activeRegister.openingAmount);
        const expectedAmount = openingAmount + arqueableTotal;
        const diff = Number(closingAmount) - expectedAmount;

        // Deposit rule: keep openingAmount in drawer, deposit the rest
        // deposit = countedAmount - openingAmount
        const depositAmount = Number(closingAmount) - openingAmount;

        const updatedRegister = await (prisma as any).cashRegister.update({
            where: { id: activeRegister.id },
            data: {
                closingAmount: Number(closingAmount),
                expectedAmount: expectedAmount,
                difference: diff,
                depositAmount: depositAmount,
                status: 'CLOSED',
                closedById,
                closedAt: new Date(),
                // We can use auditLog or a new field if we want to store breakdown, 
                // but let's just return it for now or assume UI can show it from sales.
            }
        });

        return NextResponse.json({
            ...updatedRegister,
            breakdown
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
