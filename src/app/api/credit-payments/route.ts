import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { calculateAppliedAmount } from '@/lib/credit-payment';

const ERRORS: Record<string, { status: number; message: string }> = {
    CAJA_CERRADA: {
        status: 403,
        message: 'No hay una caja abierta. Abrí la caja diaria antes de registrar cobros.',
    },
    CUSTOMER_NOT_FOUND: { status: 404, message: 'Cliente no encontrado.' },
    CUSTOMER_INACTIVE: { status: 400, message: 'El cliente está desactivado.' },
    PAYMENT_METHOD_NOT_FOUND: { status: 400, message: 'Método de pago inválido.' },
    PAYMENT_METHOD_IS_CREDIT: {
        status: 400,
        message: 'No se puede cobrar una deuda con un método a cuenta.',
    },
    PAYMENT_METHOD_PERCENTAGE_INVALID: {
        status: 400,
        message: 'El porcentaje del método de pago no permite calcular el importe neto.',
    },
    AMOUNT_EXCEEDS_DEBT: {
        status: 400,
        message: 'El neto aplicado supera la deuda actual del cliente.',
    },
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));

        const payments = await (prisma as any).creditPayment.findMany({
            where: customerId ? { customerId } : undefined,
            include: {
                customer: { select: { id: true, name: true, dni: true } },
                paymentMethod: { select: { name: true, isArqueable: true, isCredit: true } },
                user: { select: { name: true } },
                cashRegister: { select: { shortId: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json(payments);
    } catch (error: any) {
        console.error('API Error CreditPayments GET:', error);
        return NextResponse.json({ error: error.message || 'Error al cargar cobros' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerId, userId } = body;
        const amount = Number(body.amount);
        const paymentMethodId = body.paymentMethodId;

        if (!customerId || !paymentMethodId || !userId) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ error: 'El importe debe ser mayor a cero' }, { status: 400 });
        }

        const result = await (prisma as any).$transaction(async (tx: any) => {
            const activeRegister = await tx.cashRegister.findFirst({
                where: { status: 'OPEN' },
            });

            if (!activeRegister) throw new Error('CAJA_CERRADA');

            const customer = await tx.creditCustomer.findUnique({
                where: { id: customerId },
            });
            if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
            if (!customer.active) throw new Error('CUSTOMER_INACTIVE');

            const paymentMethod = await tx.paymentMethod.findUnique({
                where: { id: paymentMethodId },
            });
            if (!paymentMethod) throw new Error('PAYMENT_METHOD_NOT_FOUND');
            if (paymentMethod.isCredit) throw new Error('PAYMENT_METHOD_IS_CREDIT');

            const [salesAgg, payments] = await Promise.all([
                tx.sale.aggregate({
                    where: { creditCustomerId: customerId, status: 'COMPLETED' },
                    _sum: { total: true },
                }),
                tx.creditPayment.findMany({
                    where: { customerId },
                    select: { amount: true, appliedAmount: true },
                }),
            ]);

            const totalCharged = Number(salesAgg._sum.total || 0);
            const totalPaid = payments.reduce(
                (sum: number, payment: any) => sum + Number(payment.appliedAmount ?? payment.amount),
                0
            );
            const balance = totalCharged - totalPaid;

            const percentage = Number(paymentMethod.percentage || 0);
            const appliedAmount = calculateAppliedAmount(amount, percentage);
            if (appliedAmount === null) {
                throw new Error('PAYMENT_METHOD_PERCENTAGE_INVALID');
            }

            if (appliedAmount > balance + 0.01) throw new Error('AMOUNT_EXCEEDS_DEBT');

            const payment = await tx.creditPayment.create({
                data: {
                    amount,
                    appliedAmount,
                    customerId,
                    paymentMethodId,
                    cashRegisterId: activeRegister.id,
                    userId,
                },
                include: {
                    customer: { select: { id: true, name: true, dni: true } },
                    paymentMethod: { select: { name: true, isArqueable: true, isCredit: true } },
                    user: { select: { name: true } },
                    cashRegister: { select: { shortId: true } },
                },
            });

            return {
                ...payment,
                newBalance: Math.round((balance - appliedAmount + Number.EPSILON) * 100) / 100,
            };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        if (ERRORS[error.message]) {
            const mapped = ERRORS[error.message];
            return NextResponse.json(
                { error: error.message, message: mapped.message },
                { status: mapped.status }
            );
        }
        console.error('API Error CreditPayments POST:', error);
        return NextResponse.json({ error: error.message || 'Error al registrar cobro' }, { status: 500 });
    }
}
