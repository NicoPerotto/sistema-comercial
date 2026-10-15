import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

const ORDER = [{ isDefault: 'desc' as const }, { name: 'asc' as const }];

export async function GET() {
    try {
        let methods = await (prisma as any).paymentMethod.findMany({
            orderBy: ORDER
        });

        // Seed if empty
        if (methods.length === 0) {
            const defaultMethods = [
                { name: 'Efectivo', percentage: 0, isArqueable: true, isDefault: true },
                { name: 'Transferencia', percentage: 0, isArqueable: false, isDefault: false },
                { name: 'QR', percentage: 0, isArqueable: false, isDefault: false },
                { name: 'Credito', percentage: 10, isArqueable: false, isDefault: false },
                { name: 'Cuenta corriente', percentage: 5, isArqueable: false, isDefault: false }
            ];

            for (const method of defaultMethods) {
                await (prisma as any).paymentMethod.create({ data: method });
            }

            methods = await (prisma as any).paymentMethod.findMany({
                orderBy: ORDER
            });
            return NextResponse.json(methods);
        }

        // Backfill: si hay métodos pero ninguno es default (DBs viejas),
        // marcamos "Efectivo" (o el primero) como default.
        if (!methods.some((m: any) => m.isDefault)) {
            const fallback = methods.find((m: any) => m.name === 'Efectivo') ?? methods[0];
            if (fallback) {
                await (prisma as any).paymentMethod.update({
                    where: { id: fallback.id },
                    data: { isDefault: true }
                });
                methods = await (prisma as any).paymentMethod.findMany({
                    orderBy: ORDER
                });
            }
        }

        return NextResponse.json(methods);
    } catch (error: any) {
        console.error('API Error PaymentMethods GET:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, percentage, isArqueable, isDefault } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const makeDefault = !!isDefault;

        if (makeDefault) {
            await (prisma as any).paymentMethod.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const method = await (prisma as any).paymentMethod.create({
            data: {
                name,
                percentage: parseFloat(percentage) || 0,
                isArqueable: isArqueable ?? true,
                isDefault: makeDefault
            }
        });

        return NextResponse.json(method);
    } catch (error: any) {
        console.error('API Error PaymentMethods POST:', error);
        return NextResponse.json({ error: 'Error al crear método de pago' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, percentage, isArqueable, isDefault } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const makeDefault = !!isDefault;

        if (makeDefault) {
            await (prisma as any).paymentMethod.updateMany({
                where: { id: { not: id }, isDefault: true },
                data: { isDefault: false }
            });
        }

        const method = await (prisma as any).paymentMethod.update({
            where: { id },
            data: {
                name,
                percentage: parseFloat(percentage) || 0,
                isArqueable: isArqueable ?? true,
                isDefault: makeDefault
            }
        });

        return NextResponse.json(method);
    } catch (error: any) {
        console.error('API Error PaymentMethods PUT:', error);
        return NextResponse.json({ error: 'Error al actualizar método de pago' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID' }, { status: 400 });
        }

        // Check if there are sales using this payment method
        const salesCount = await (prisma as any).sale.count({
            where: { paymentMethodId: id }
        });

        if (salesCount > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar porque ya tiene ventas asociadas'
            }, { status: 400 });
        }

        const toDelete = await (prisma as any).paymentMethod.findUnique({
            where: { id }
        });

        await (prisma as any).paymentMethod.delete({
            where: { id }
        });

        // Si se eliminó el default, promover otro para que siempre haya uno.
        if (toDelete?.isDefault) {
            const next = await (prisma as any).paymentMethod.findFirst({
                orderBy: { name: 'asc' }
            });
            if (next) {
                await (prisma as any).paymentMethod.update({
                    where: { id: next.id },
                    data: { isDefault: true }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error PaymentMethods DELETE:', error);
        return NextResponse.json({ error: 'Error al eliminar método de pago' }, { status: 500 });
    }
}
