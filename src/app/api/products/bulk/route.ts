import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const products = await request.json();

        if (!Array.isArray(products)) {
            return NextResponse.json({ error: 'Formato inválido. Se espera un array.' }, { status: 400 });
        }

        // 1. Obtener todas las categorías para mapeo utilizando (prisma as any)
        const allCategories = await (prisma as any).category.findMany();
        const categoryMap = new Map(allCategories.map((c: any) => [c.name.toLowerCase(), c.id]));

        const results = {
            created: 0,
            updated: 0,
            errors: 0
        };

        for (const item of products) {
            try {
                // Limpieza de datos (Mapeo de nombres de columnas de Excel)
                // Usamos nombres en español para el Excel base como pidió el usuario
                const name = (item.Nombre || item.Nombre).toString().trim();
                const barcode = item.Código?.toString().trim() || item.Barcode?.toString().trim() || null;
                const categoryName = item.Categoría?.toString().trim() || item.Categoria?.toString().trim();
                const price = parseFloat(item.Precio) || 0;
                const cost = item.Costo ? parseFloat(item.Costo) : null;
                const stockQty = parseFloat(item.Stock) || 0;

                if (!name) {
                    results.errors++;
                    continue;
                }

                // Obtener o crear categoría
                let categoryId = null;
                if (categoryName) {
                    const normalizedCat = categoryName.toLowerCase();
                    if (categoryMap.has(normalizedCat)) {
                        categoryId = categoryMap.get(normalizedCat);
                    } else {
                        const newCat = await (prisma as any).category.create({
                            data: { name: categoryName, icon: 'Package' }
                        });
                        categoryId = newCat.id;
                        categoryMap.set(normalizedCat, categoryId);
                    }
                } else {
                    // Si no hay categoría, buscar o crear una por defecto "Sin Categoría"
                    const fallbackName = 'Sin Categoría';
                    const normalizedFallback = fallbackName.toLowerCase();
                    if (categoryMap.has(normalizedFallback)) {
                        categoryId = categoryMap.get(normalizedFallback);
                    } else {
                        const defaultCat = await (prisma as any).category.create({
                            data: { name: fallbackName, icon: 'Package' }
                        });
                        categoryId = defaultCat.id;
                        categoryMap.set(normalizedFallback, categoryId);
                    }
                }

                // Buscar si existe el producto
                let existingProduct = null;
                if (barcode) {
                    existingProduct = await prisma.product.findUnique({
                        where: { barcode }
                    });
                } else {
                    // Si no hay barcode, intentar buscar por nombre exacto
                    existingProduct = await prisma.product.findFirst({
                        where: { name }
                    });
                }

                if (existingProduct) {
                    // ACTUALIZAR: Sumar stock y actualizar precios
                    await (prisma.product as any).update({
                        where: { id: existingProduct.id },
                        data: {
                            price,
                            cost,
                            stock: existingProduct.stock + stockQty,
                            categoryId: categoryId || (existingProduct as any).categoryId
                        }
                    });
                    results.updated++;
                } else {
                    // CREAR NUEVO
                    await (prisma.product as any).create({
                        data: {
                            name,
                            barcode,
                            price,
                            cost,
                            stock: stockQty,
                            categoryId: categoryId,
                        }
                    });
                    results.created++;
                }
            } catch (err) {
                console.error('Error procesando item:', item, err);
                results.errors++;
            }
        }

        return NextResponse.json({
            success: true,
            summary: `Importación finalizada. Creados: ${results.created}, Actualizados: ${results.updated}, Errores: ${results.errors}`
        });

    } catch (error) {
        console.error('Error en bulk import API:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
