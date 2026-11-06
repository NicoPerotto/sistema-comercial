import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

function round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const customer = await (prisma as any).creditCustomer.findUnique({
            where: { id },
            include: {
                sales: {
                    where: { status: 'COMPLETED' },
                    include: {
                        items: {
                            include: {
                                product: { select: { name: true, brand: true } },
                            },
                        },
                        paymentMethod: { select: { name: true, isCredit: true } },
                        user: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                payments: {
                    include: {
                        paymentMethod: { select: { name: true, isArqueable: true } },
                        user: { select: { name: true } },
                        cashRegister: { select: { shortId: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!customer) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        const totalCharged = customer.sales.reduce(
            (sum: number, sale: any) => sum + Number(sale.total),
            0
        );
        const totalPaid = customer.payments.reduce(
            (sum: number, payment: any) => sum + Number(payment.appliedAmount ?? payment.amount),
            0
        );

        const balance = round2(totalCharged - totalPaid);
        const creditLimit =
            customer.creditLimit === null || customer.creditLimit === undefined
                ? null
                : round2(Number(customer.creditLimit));

        return NextResponse.json({
            ...customer,
            creditLimit,
            totalCharged: round2(totalCharged),
            totalPaid: round2(totalPaid),
            balance,
            available: creditLimit === null ? null : round2(creditLimit - balance),
            overLimit: creditLimit !== null && balance > creditLimit + 0.01,
        });
    } catch (error: any) {
        console.error('API Error CreditCustomer detail GET:', error);
        return NextResponse.json({ error: error.message || 'Error al cargar cliente' }, { status: 500 });
    }
}
