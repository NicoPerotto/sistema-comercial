import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 1. Get last closure to find start date
        const lastClosure = await (prisma as any).weeklyClosure.findFirst({
            orderBy: { endDate: 'desc' }
        });

        const startDate = lastClosure ? lastClosure.endDate : new Date(0); // Epoch if no closure
        const endDate = new Date();

        // 2. Get all closed registries in the period
        const closedRegisters = await (prisma as any).cashRegister.findMany({
            where: {
                status: 'CLOSED',
                closedAt: {
                    gt: startDate,
                    lte: endDate
                }
            },
            include: {
                sales: {
                    include: { paymentMethod: true }
                },
                supplierPayments: {
                    include: { paymentMethod: true }
                }
            }
        });

        // 3. Get all supplier payments in the period (even those not linked to a specific register)
        // because the week closure counts all business movements.
        const allSupplierPayments = await (prisma as any).supplierPayment.findMany({
            where: {
                createdAt: {
                    gt: startDate,
                    lte: endDate
                }
            },
            include: { paymentMethod: true }
        });

        // 4. Get all sales in the period separately to be sure we don't miss any 
        // (though they should be in registers, but just in case)
        const allSales = await (prisma as any).sale.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gt: startDate,
                    lte: endDate
                }
            },
            include: { paymentMethod: true }
        });

        // 5. Get all payment methods to build the structure
        const paymentMethods = await (prisma as any).paymentMethod.findMany();

        // Build the breakdown
        const breakdown = paymentMethods.map((pm: any) => {
            const methodSales = allSales
                .filter((s: any) => s.paymentMethodId === pm.id)
                .reduce((acc: number, s: any) => acc + Number(s.total), 0);

            const methodSupplierPayments = allSupplierPayments
                .filter((p: any) => p.paymentMethodId === pm.id)
                .reduce((acc: number, p: any) => acc + Number(p.amount), 0);

            // Important: Cash method might need to include opening amount of the VERY FIRST register 
            // since the last week closure? 
            // Actually, if we just subtract, we are looking at NET results of the week.
            // But usually the user wants "Total in drawer".

            return {
                paymentMethodId: pm.id,
                paymentMethodName: pm.name,
                isArqueable: pm.isArqueable,
                salesTotal: methodSales,
                supplierPaymentsTotal: methodSupplierPayments,
                expectedTotal: methodSales - methodSupplierPayments,
                realAmount: 0 // Default for the draft
            };
        });

        return NextResponse.json({
            startDate,
            endDate,
            breakdown,
            totalExpected: breakdown.reduce((acc: number, b: any) => acc + b.expectedTotal, 0),
            registersCount: closedRegisters.length
        });

    } catch (error: any) {
        console.error('API Error WeeklyClosure DRAFT:', error);
        return NextResponse.json({ error: error.message || 'Error al cargar borrador' }, { status: 500 });
    }
}
