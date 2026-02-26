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
                    paymentMethod: { select: { name: true, percentage: true } } // Solo los campos necesarios
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
        const { userId, type, items, auditLog, paymentMethodId } = body;

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
            if (paymentMethodId && !isNoRealizada) {
                const pm = await (tx as any).paymentMethod.findUnique({
                    where: { id: paymentMethodId }
                });
                if (pm) percentage = pm.percentage;
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

            // 4. Create the sale
            const sale = await (tx as any).sale.create({
                data: {
                    total: totalValue,
                    type: type || 'VENTA',
                    userId: userId,
                    auditLog: auditLog ? JSON.stringify(auditLog) : null,
                    paymentMethodId: paymentMethodId || null,
                    status: isNoRealizada ? 'CANCELLED' : 'COMPLETED',
                    cashRegisterId: activeRegister ? activeRegister.id : null,
                    items: {
                        create: items.map((item: any) => {
                            const product = productMap.get(item.productId) as any;
                            return {
                                quantity: item.quantity,
                                price: product.price,
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

            return sale;
        });

        return NextResponse.json({ success: true, sale: result });
    } catch (error: any) {
        console.error('Sale Error:', error);
        if (error.message === 'CAJA_CERRADA') {
            return NextResponse.json(
                { error: 'CAJA_CERRADA', message: 'No hay una caja abierta. Abrí la caja diaria antes de registrar ventas.' },
                { status: 403 }
            );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
