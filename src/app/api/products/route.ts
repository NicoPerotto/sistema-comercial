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
        const { name, categoryId, price, stock, barcode, description, cost, hasIva, margin, sellByWeight } = body;

        if (!name || !categoryId) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
        }

        const parsedCost = cost ? parseFloat(cost) : 0;
        const parsedMargin = margin ? parseFloat(margin) : 0;
        const useHasIva = !!hasIva;

        // Calculate price based on cost, iva and margin if price is not provided or if we want to ensure it matches
        let calculatedPrice = parseFloat(price);
        if (isNaN(calculatedPrice) && parsedCost > 0) {
            const base = useHasIva ? parsedCost * 1.21 : parsedCost;
            calculatedPrice = base * (1 + parsedMargin / 100);
        }

        const parsedStock = parseFloat(stock);

        const product = await (prisma.product as any).create({
            data: {
                name,
                category: { connect: { id: categoryId } },
                price: isNaN(calculatedPrice) ? 0 : calculatedPrice,
                stock: isNaN(parsedStock) ? 0 : parsedStock,
                barcode: barcode || null,
                description: description || '',
                cost: parsedCost,
                // hasIva and margin are handled via executeRaw below due to locked prisma client
                sellByWeight: !!sellByWeight
            }
        });

        // Workaround: Update fields directly in DB because Prisma Client is locked/stale
        await prisma.$executeRawUnsafe(
            `UPDATE Product SET hasIva = ?, margin = ? WHERE id = ?`,
            useHasIva ? 1 : 0, parsedMargin, product.id
        );

        return NextResponse.json({ ...product, hasIva: useHasIva, margin: parsedMargin });
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
        const { id, name, categoryId, price, stock, barcode, description, cost, hasIva, margin, sellByWeight } = body;

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID del producto' }, { status: 400 });
        }

        const parsedCost = cost ? parseFloat(cost) : 0;
        const parsedMargin = margin ? parseFloat(margin) : 0;
        const useHasIva = !!hasIva;

        let calculatedPrice = parseFloat(price);
        if (!calculatedPrice && parsedCost > 0) {
            const base = useHasIva ? parsedCost * 1.21 : parsedCost;
            calculatedPrice = base * (1 + parsedMargin / 100);
        }

        const parsedStock = parseFloat(stock);

        const product = await (prisma.product as any).update({
            where: { id: id },
            data: {
                name,
                category: { connect: { id: categoryId } },
                price: isNaN(calculatedPrice) ? 0 : calculatedPrice,
                stock: isNaN(parsedStock) ? 0 : parsedStock,
                barcode: barcode || null,
                description: description || '',
                cost: parsedCost,
                // hasIva and margin are updated via raw SQL below
                sellByWeight: !!sellByWeight
            }
        });

        // Workaround for stale Prisma Client
        await prisma.$executeRawUnsafe(
            `UPDATE Product SET hasIva = ?, margin = ? WHERE id = ?`,
            useHasIva ? 1 : 0, parsedMargin, id
        );

        return NextResponse.json({ ...product, hasIva: useHasIva, margin: parsedMargin });
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
