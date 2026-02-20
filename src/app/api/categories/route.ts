import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const categories = await (prisma as any).category.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error: any) {
        console.error('API Error Categories GET:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, icon } = body;

        if (!name) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const category = await (prisma as any).category.create({
            data: {
                name,
                icon: icon || 'Package'
            }
        });

        return NextResponse.json(category);
    } catch (error: any) {
        console.error('API Error Categories POST:', error);
        const errorMessage = error.code === 'P2002'
            ? 'Esta categoría ya existe'
            : error.message || 'Error al crear categoría';

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, icon } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const category = await (prisma as any).category.update({
            where: { id },
            data: {
                name,
                icon: icon || 'Package'
            }
        });

        return NextResponse.json(category);
    } catch (error: any) {
        console.error('API Error Categories PUT:', error);
        return NextResponse.json({ error: error.message || 'Error al actualizar categoría' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID' }, { status: 400 });
        }

        // Check if there are products using this category
        const productsCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productsCount > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar la categoría porque tiene productos asociados'
            }, { status: 400 });
        }

        await (prisma.category as any).delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error Categories DELETE:', error);
        return NextResponse.json({ error: error.message || 'Error al eliminar categoría' }, { status: 500 });
    }
}
