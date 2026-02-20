import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, categoryId, price, stock, barcode, description, cost, sellByWeight } = body;

        if (!name || !categoryId || price === undefined) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
        }

        const parsedPrice = parseFloat(price);
        const parsedStock = parseFloat(stock);
        const parsedCost = cost ? parseFloat(cost) : null;

        if (isNaN(parsedPrice)) {
            return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
        }

        const product = await (prisma.product as any).create({
            data: {
                name,
                categoryId,
                price: parsedPrice,
                stock: isNaN(parsedStock) ? 0 : parsedStock,
                barcode: barcode || null,
                description: description || '',
                cost: parsedCost && !isNaN(parsedCost) ? parsedCost : null,
                sellByWeight: !!sellByWeight
            }
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('API Error POST:', error);
        const errorMessage = error.code === 'P2002'
            ? 'El código de barras ya está en uso por otro producto'
            : error.message || 'Error desconocido al crear';

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, categoryId, price, stock, barcode, description, cost, sellByWeight } = body;

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID del producto' }, { status: 400 });
        }

        const parsedPrice = parseFloat(price);
        const parsedStock = parseFloat(stock);
        const parsedCost = cost ? parseFloat(cost) : null;

        if (isNaN(parsedPrice)) {
            return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
        }

        const product = await (prisma.product as any).update({
            where: { id: id },
            data: {
                name,
                categoryId,
                price: parsedPrice,
                stock: isNaN(parsedStock) ? 0 : parsedStock,
                barcode: barcode || null,
                description: description || '',
                cost: parsedCost && !isNaN(parsedCost) ? parsedCost : null,
                sellByWeight: !!sellByWeight
            }
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('API Error PUT:', error);
        const errorMessage = error.code === 'P2002'
            ? 'El código de barras ya está en uso por otro producto'
            : error.message || 'Error desconocido al actualizar';

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID del producto' }, { status: 400 });
        }

        // 1. Verificar si tiene ventas asociadas
        const salesCount = await (prisma as any).saleItem.count({
            where: { productId: id }
        });

        if (salesCount > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar el producto porque ya tiene ventas registradas. Te sugerimos dejar el stock en 0.'
            }, { status: 400 });
        }

        // 2. Intentar eliminar
        await (prisma.product as any).delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error DELETE:', error);

        const message = error.code === 'P2003'
            ? 'No se puede eliminar: el producto está siendo usado en el sistema.'
            : 'Error al intentar eliminar el producto';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
