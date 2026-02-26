import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const products = await request.json();

        if (!Array.isArray(products)) {
            return NextResponse.json({ error: 'Formato inválido. Se espera un array.' }, { status: 400 });
        }

        // 1. Pre-cargar todas las categorías y productos existentes en memoria
        //    para evitar queries N+1 dentro del loop principal.
        const [allCategories, allProducts] = await Promise.all([
            prisma.category.findMany(),
            prisma.product.findMany({ select: { id: true, name: true, barcode: true, stock: true } }),
        ]);

        const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));
        // Índices en memoria para lookup O(1) sin queries adicionales
        const productByBarcode = new Map(allProducts.filter(p => p.barcode).map(p => [p.barcode!, p]));
        const productByName = new Map(allProducts.map(p => [p.name.toLowerCase(), p]));

        const results = { created: 0, updated: 0, errors: 0 };

        // 2. Pre-crear categorías faltantes (fuera de la transacción principal para no bloquearla)
        const missingCategories = new Set<string>();
        for (const item of products) {
            const raw = item.Categoría?.toString().trim() || item.Categoria?.toString().trim() || 'Sin Categoría';
            const normalized = raw.toLowerCase();
            if (!categoryMap.has(normalized)) missingCategories.add(raw);
        }
        for (const catName of missingCategories) {
            const newCat = await prisma.category.create({ data: { name: catName, icon: 'Package' } });
            categoryMap.set(catName.toLowerCase(), newCat.id);
        }

        // 3. Procesar productos en una sola transacción para atomicidad y mejor rendimiento
        await prisma.$transaction(async (tx) => {
            for (const item of products) {
                try {
                    const name = (item.Nombre || '').toString().trim();
                    const barcode = item.Código?.toString().trim() || item.Barcode?.toString().trim() || null;
                    const categoryName = item.Categoría?.toString().trim() || item.Categoria?.toString().trim() || 'Sin Categoría';
                    const price = parseFloat(item.Precio) || 0;
                    const cost = item.Costo ? parseFloat(item.Costo) : null;
                    const stockQty = parseFloat(item.Stock) || 0;

                    if (!name) { results.errors++; continue; }

                    const categoryId = categoryMap.get(categoryName.toLowerCase()) ?? null;

                    // Buscar en los índices en-memoria (sin queries adicionales)
                    const existingProduct = (barcode && productByBarcode.get(barcode)) ||
                        productByName.get(name.toLowerCase());

                    if (existingProduct) {
                        await (tx as any).product.update({
                            where: { id: existingProduct.id },
                            data: {
                                price,
                                cost,
                                // Convertimos el Decimal a número antes de sumar
                                stock: Number(existingProduct.stock) + stockQty,
                                ...(categoryId ? { categoryId } : {}),
                            },
                        });
                        results.updated++;
                    } else {
                        await (tx as any).product.create({
                            data: { name, barcode, price, cost, stock: stockQty, categoryId },
                        });
                        results.created++;
                    }
                } catch (err) {
                    console.error('Error procesando item:', item, err);
                    results.errors++;
                }
            }
        });

        return NextResponse.json({
            success: true,
            summary: `Importación finalizada. Creados: ${results.created}, Actualizados: ${results.updated}, Errores: ${results.errors}`
        });

    } catch (error) {
        console.error('Error en bulk import API:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
