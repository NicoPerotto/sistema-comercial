import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const suppliers = await (prisma as any).supplier.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(suppliers);
    } catch (error: any) {
        console.error('API Error Suppliers GET:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, contact } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const supplier = await (prisma as any).supplier.create({
            data: {
                name,
                contact: contact || null
            }
        });

        return NextResponse.json(supplier);
    } catch (error: any) {
        console.error('API Error Suppliers POST:', error);
        const errorMessage = error.code === 'P2002'
            ? 'Este proveedor ya existe'
            : error.message || 'Error al crear proveedor';

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, contact } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const supplier = await (prisma as any).supplier.update({
            where: { id },
            data: {
                name,
                contact: contact || null
            }
        });

        return NextResponse.json(supplier);
    } catch (error: any) {
        console.error('API Error Suppliers PUT:', error);
        return NextResponse.json({ error: error.message || 'Error al actualizar proveedor' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID' }, { status: 400 });
        }

        // Check for payments
        const paymentsCount = await (prisma as any).supplierPayment.count({
            where: { supplierId: id }
        });

        if (paymentsCount > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar el proveedor porque tiene pagos registrados'
            }, { status: 400 });
        }

        await (prisma as any).supplier.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error Suppliers DELETE:', error);
        return NextResponse.json({ error: error.message || 'Error al eliminar proveedor' }, { status: 500 });
    }
}
