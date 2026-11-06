import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
        const skip = (page - 1) * limit;

        const [sales, total] = await prisma.$transaction([
            prisma.sale.findMany({
                include: {
                    user: {
                        select: {
                            name: true,
                            role: true
                        }
                    },
                    items: {
                        include: {
                            product: { select: { name: true } } // Solo traemos el nombre, no todo el producto
                        }
                    },
                    paymentMethod: { select: { name: true, percentage: true, isCredit: true } }, // Solo los campos necesarios
                    creditCustomer: { select: { id: true, name: true, dni: true } },
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit,
            }),
            prisma.sale.count(),
        ]);

        return NextResponse.json({ sales, total, page, limit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, type, items, auditLog, paymentMethodId, creditCustomerId } = body;
        const confirmOverLimit = body.confirmOverLimit === true;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'La venta debe tener al menos un producto' }, { status: 400 });
        }

        // Process sale in a transaction
        const result = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const isNoRealizada = type === 'VENTA_NO_REALIZADA';

            // 0. Find active cash register session
            const activeRegister = await (tx as any).cashRegister.findFirst({
                where: { status: 'OPEN' }
            });

            // GUARD: block real sales if register is closed
            if (!activeRegister && !isNoRealizada) {
                throw new Error('CAJA_CERRADA');
            }

            // 1. First, fetch all products to get their prices and check stock
            const productIds = items.map((item: any) => item.productId);
            const dbProducts = await (tx as any).product.findMany({
                where: { id: { in: productIds } },
            });

            const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

            // 2. Fetch payment method if provided
            let percentage = 0;
            let paymentMethod: any = null;
            if (paymentMethodId && !isNoRealizada) {
                paymentMethod = await (tx as any).paymentMethod.findUnique({
                    where: { id: paymentMethodId }
                });
                if (paymentMethod) percentage = paymentMethod.percentage;
            }

            // 2b. Si el método es cuenta corriente, la venta debe quedar
            // asociada a un cliente/deudor activo.
            let finalCreditCustomerId: string | null = null;
            let selectedCreditCustomer: any = null;
            if (!isNoRealizada && paymentMethod?.isCredit) {
                if (!creditCustomerId) throw new Error('CREDIT_CUSTOMER_REQUIRED');

                const customer = await (tx as any).creditCustomer.findUnique({
                    where: { id: creditCustomerId }
                });
                if (!customer || !customer.active) throw new Error('CREDIT_CUSTOMER_NOT_FOUND');

                finalCreditCustomerId = customer.id;
                selectedCreditCustomer = customer;
            }

            // 3. Calculate subtotal and check stock
            for (const item of items) {
                const product = productMap.get(item.productId) as any;
                if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado`);

                // Only check stock for positive quantities and realized sales
                if (!isNoRealizada && item.quantity > 0 && product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
                }
                subtotal += Number(product.price) * item.quantity;
            }

            // Calculate final total with payment method modifier
            const totalValue = subtotal * (1 + (percentage / 100));

            // 3b. Límite de crédito: controla la deuda acumulada, no bloquea
            // (salvo que el cliente YA esté excedido y no haya confirmación).
            const round2 = (value: number) =>
                Math.round((value + Number.EPSILON) * 100) / 100;

            let creditLimitAtSale: number | null = null;
            let creditLimitExceeded = false;
            let creditInfo: any = null;

            if (selectedCreditCustomer && selectedCreditCustomer.creditLimit != null) {
                const limit = round2(Number(selectedCreditCustomer.creditLimit));

                const [salesAgg, payments] = await Promise.all([
                    (tx as any).sale.aggregate({
                        where: { creditCustomerId: selectedCreditCustomer.id, status: 'COMPLETED' },
                        _sum: { total: true },
                    }),
                    (tx as any).creditPayment.findMany({
                        where: { customerId: selectedCreditCustomer.id },
                        select: { amount: true, appliedAmount: true },
                    }),
                ]);

                const currentDebt = round2(
                    Number(salesAgg._sum.total || 0) -
                        payments.reduce(
                            (sum: number, payment: any) => sum + Number(payment.appliedAmount ?? payment.amount),
                            0
                        )
                );
                const debtAfter = round2(currentDebt + totalValue);
                const alreadyOver = currentDebt > limit + 0.01;
                const wouldExceed = debtAfter > limit + 0.01;

                creditLimitAtSale = limit;

                if (alreadyOver && !confirmOverLimit) {
                    const limitError: any = new Error('CREDIT_LIMIT_EXCEEDED');
                    limitError.details = {
                        limit,
                        currentDebt,
                        available: round2(limit - currentDebt),
                        saleTotal: round2(totalValue),
                        excess: round2(debtAfter - limit),
                    };
                    throw limitError;
                }

                creditLimitExceeded = wouldExceed;
                creditInfo = {
                    limit,
                    currentDebt,
                    newBalance: debtAfter,
                    available: round2(limit - debtAfter),
                    exceeded: wouldExceed,
                };
            }

            // 4. Create the sale
            const sale = await (tx as any).sale.create({
                data: {
                    total: totalValue,
                    type: type || 'VENTA',
                    userId: userId,
                    auditLog: auditLog ? JSON.stringify(auditLog) : null,
                    paymentMethodId: paymentMethodId || null,
                    creditCustomerId: finalCreditCustomerId,
                    creditLimitAtSale,
                    creditLimitExceeded,
                    status: isNoRealizada ? 'CANCELLED' : 'COMPLETED',
                    cashRegisterId: activeRegister ? activeRegister.id : null,
                    items: {
                        create: items.map((item: any) => {
                            const product = productMap.get(item.productId) as any;
                            return {
                                quantity: item.quantity,
                                price: product.price,
                                cost: product.cost,
                                hasIva: product.hasIva,
                                margin: product.margin,
                                productId: item.productId,
                            };
                        }),
                    },
                },
            });

            // 5. Update stock en paralelo (only if not "No Realizada")
            if (!isNoRealizada) {
                await Promise.all(
                    items.map((item: any) =>
                        (tx as any).product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } },
                        })
                    )
                );
            }

            return { sale, creditInfo };
        });

        return NextResponse.json({ success: true, sale: result.sale, credit: result.creditInfo });
    } catch (error: any) {
        if (error.message === 'CAJA_CERRADA') {
            return NextResponse.json(
                { error: 'CAJA_CERRADA', message: 'No hay una caja abierta. Abrí la caja diaria antes de registrar ventas.' },
                { status: 403 }
            );
        }
        if (error.message === 'CREDIT_LIMIT_EXCEEDED') {
            return NextResponse.json(
                {
                    error: 'CREDIT_LIMIT_EXCEEDED',
                    message: 'El cliente ya superó su límite de crédito. Confirmá si querés continuar.',
                    ...(error.details || {}),
                },
                { status: 409 }
            );
        }
        if (error.message === 'CREDIT_CUSTOMER_REQUIRED') {
            return NextResponse.json(
                { error: 'CREDIT_CUSTOMER_REQUIRED', message: 'Seleccioná el cliente al que se le carga la venta a cuenta.' },
                { status: 400 }
            );
        }
        if (error.message === 'CREDIT_CUSTOMER_NOT_FOUND') {
            return NextResponse.json(
                { error: 'CREDIT_CUSTOMER_NOT_FOUND', message: 'El cliente seleccionado no existe o está desactivado.' },
                { status: 400 }
            );
        }
        console.error('Sale Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
