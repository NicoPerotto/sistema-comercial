import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const methods = await (prisma as any).paymentMethod.findMany({
            orderBy: { name: 'asc' }
        });

        // Seed if empty
        if (methods.length === 0) {
            const defaultMethods = [
                { name: 'Efectivo', percentage: 0, isArqueable: true },
                { name: 'Transferencia', percentage: 0, isArqueable: false },
                { name: 'QR', percentage: 0, isArqueable: false },
                { name: 'Credito', percentage: 10, isArqueable: false },
                { name: 'Cuenta corriente', percentage: 5, isArqueable: false }
            ];

            for (const method of defaultMethods) {
                await (prisma as any).paymentMethod.create({ data: method });
            }

            const newMethods = await (prisma as any).paymentMethod.findMany({
                orderBy: { name: 'asc' }
            });
            return NextResponse.json(newMethods);
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
        const { name, percentage, isArqueable } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const method = await (prisma as any).paymentMethod.create({
            data: {
                name,
                percentage: parseFloat(percentage) || 0,
                isArqueable: isArqueable ?? true
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
        const { id, name, percentage, isArqueable } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const method = await (prisma as any).paymentMethod.update({
            where: { id },
            data: {
                name,
                percentage: parseFloat(percentage) || 0,
                isArqueable: isArqueable ?? true
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

        await (prisma as any).paymentMethod.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error PaymentMethods DELETE:', error);
        return NextResponse.json({ error: 'Error al eliminar método de pago' }, { status: 500 });
    }
}
