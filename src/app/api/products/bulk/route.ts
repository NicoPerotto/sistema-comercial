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
        const errorDetails: string[] = [];

        // 2. Pre-crear categorías faltantes (fuera de transacción para no bloquear)
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

        // 3. Procesar productos UNO POR UNO (sin $transaction interactiva).
        //    En Vercel + Postgres la transacción interactiva tiene timeout de 5s y
        //    con muchos items lo supera (P2028). Hacerlo fuera de transacción es
        //    más tolerante: si un item falla, el resto continúa.
        for (const item of products) {
            try {
                const name = (item.Nombre || '').toString().trim();
                const brand = (item.Marca || item.brand || '').toString().trim();
                const subcategory = (item.Subcategoría || item.Subcategoria || item.subcategory || '').toString().trim();
                const barcode = item['Código de barras']?.toString().trim()
                    || item['Codigo de barras']?.toString().trim()
                    || item.Código?.toString().trim()
                    || item.Codigo?.toString().trim()
                    || item.Barcode?.toString().trim()
                    || item.barcode?.toString().trim()
                    || null;
                const categoryName = item.Categoría?.toString().trim() || item.Categoria?.toString().trim() || 'Sin Categoría';
                const price = parseFloat(item.Precio) || 0;
                const cost = item.Costo ? parseFloat(item.Costo) : 0;
                const stockQty = parseFloat(item.Stock) || 0;
                const hasIva = item['Tiene IVA']?.toString().toUpperCase() === 'SI' || !!item.hasIva;
                const margin = parseFloat(item['Margen %']) || parseFloat(item.margin) || 0;

                if (!name) {
                    results.errors++;
                    errorDetails.push('Fila sin nombre (ignorada)');
                    continue;
                }

                const categoryId = categoryMap.get(categoryName.toLowerCase()) ?? null;

                // Buscar en los índices en-memoria (sin queries adicionales)
                const existingProduct = (barcode && productByBarcode.get(barcode)) ||
                    productByName.get(name.toLowerCase());

                if (existingProduct) {
                    await (prisma as any).product.update({
                        where: { id: existingProduct.id },
                        data: {
                            ...(brand !== '' ? { brand } : {}),
                            ...(subcategory !== '' ? { subcategory } : {}),
                            ...(barcode ? { barcode } : {}),
                            price,
                            cost,
                            hasIva,
                            margin,
                            // El stock del Excel reemplaza el actual (no se suma)
                            stock: stockQty,
                            ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
                        },
                    });
                    results.updated++;
                } else {
                    const created = await (prisma as any).product.create({
                        data: {
                            name,
                            brand,
                            subcategory,
                            barcode,
                            price,
                            cost,
                            hasIva,
                            margin,
                            stock: stockQty,
                            category: categoryId ? { connect: { id: categoryId } } : undefined
                        },
                    });
                    // Actualizar índice en memoria para evitar duplicados dentro del mismo lote
                    if (created?.id) {
                        productByName.set(name.toLowerCase(), { id: created.id, name, barcode, stock: stockQty } as any);
                        if (barcode) productByBarcode.set(barcode, { id: created.id, name, barcode, stock: stockQty } as any);
                    }
                    results.created++;
                }
            } catch (err: any) {
                results.errors++;
                const label = (item?.Nombre || 'producto sin nombre')?.toString();
                errorDetails.push(`${label}: ${err?.message || 'error desconocido'}`);
                console.error('Error procesando item:', item, err);
            }
        }

        const summary = `Importación finalizada. Creados: ${results.created}, Actualizados: ${results.updated}, Errores: ${results.errors}`;
        return NextResponse.json({
            success: results.errors === 0,
            summary,
            details: errorDetails.slice(0, 10), // primeros 10 errores para no inundar
            total: products.length
        });

    } catch (error: any) {
        console.error('Error en bulk import API:', error);
        // Mensaje de error real en lugar de genérico
        return NextResponse.json({
            error: `Error al importar: ${error?.message || 'Error interno del servidor'}`,
            code: error?.code || null
        }, { status: 500 });
    }
}
