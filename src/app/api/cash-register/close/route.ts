import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { closingAmount, closedById } = await request.json();

        // 1. Find active register with sales and supplier payments
        const activeRegister = await (prisma as any).cashRegister.findFirst({
            where: { status: 'OPEN' },
            include: {
                sales: {
                    where: { status: 'COMPLETED' },
                    include: { paymentMethod: true }
                },
                supplierPayments: {
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

        // Add sales
        activeRegister.sales.forEach((sale: any) => {
            const methodName = sale.paymentMethod?.name || 'Efectivo';
            const isArqueable = sale.paymentMethod ? sale.paymentMethod.isArqueable : true;

            breakdown[methodName] = (breakdown[methodName] || 0) + Number(sale.total);

            if (isArqueable) {
                arqueableTotal += Number(sale.total);
            }
        });

        // Subtract supplier payments ONLY if flagged as paidFromCash
        activeRegister.supplierPayments.forEach((payment: any) => {
            // Check paidFromCash flag (using !! to ensure boolean even if undefined in stale client)
            if (payment.paidFromCash === true || (payment.paidFromCash === undefined && payment.cashRegisterId)) {
                const methodName = payment.paymentMethod?.name || 'Efectivo';
                const isArqueable = payment.paymentMethod ? payment.paymentMethod.isArqueable : true;

                // We subtract from the breakdown and the total for that method
                breakdown[methodName] = (breakdown[methodName] || 0) - Number(payment.amount);

                if (isArqueable) {
                    arqueableTotal -= Number(payment.amount);
                }
            }
        });

        const openingAmount = Number(activeRegister.openingAmount);
        const expectedAmount = openingAmount + arqueableTotal;
        const diff = Number(closingAmount) - expectedAmount;

        // Deposit rule: keep openingAmount in drawer, deposit the rest
        const depositAmount = Number(closingAmount) - openingAmount;

        const updatedRegister = await (prisma as any).cashRegister.update({
            where: { id: activeRegister.id },
            data: {
                closingAmount: Number(closingAmount),
                expectedAmount: expectedAmount,
                difference: diff,
                depositAmount: depositAmount > 0 ? depositAmount : 0,
                status: 'CLOSED',
                closedById,
                closedAt: new Date(),
            }
        });

        return NextResponse.json({
            ...updatedRegister,
            breakdown,
            paymentsTotal: activeRegister.supplierPayments.reduce((acc: number, p: any) => acc + Number(p.amount), 0)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
