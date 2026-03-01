import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 1. Create Admin
        const admin = await prisma.user.upsert({
            where: { email: 'admin@sistema.com' },
            update: {},
            create: {
                id: 'admin-id',
                email: 'admin@sistema.com',
                name: 'Administrador',
                role: 'ADMIN',
                password: 'admin',
            },
        });

        // 2. Create Categories and Products
        const productsData = [
            { id: 'p1', name: 'Coca Cola 1.5L', price: 1200, stock: 50, categoryName: 'Bebidas' },
            { id: 'p2', name: 'Arroz 1kg', price: 850, stock: 100, categoryName: 'Alimentos' },
            { id: 'p3', name: 'Detergente Bio', price: 2100, stock: 30, categoryName: 'Limpieza' },
            { id: 'p4', name: 'Café Molido 500g', price: 3400, stock: 15, categoryName: 'Alimentos' },
        ];

        for (const p of productsData) {
            // Ensure category exists
            const category = await prisma.category.upsert({
                where: { name: p.categoryName },
                update: {},
                create: {
                    name: p.categoryName,
                    icon: 'Package',
                },
            });

            await (prisma.product as any).upsert({
                where: { id: p.id },
                update: {
                    stock: p.stock,
                    price: p.price,
                    category: { connect: { id: category.id } }
                },
                create: {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    stock: p.stock,
                    category: { connect: { id: category.id } }
                },
            });
        }

        // 3. Create Suppliers
        const suppliers = ['Coca Cola Argentina', 'Sancor', 'Arcor', 'Molinos Rio de la Plata'];
        for (const name of suppliers) {
            await (prisma as any).supplier.upsert({
                where: { name },
                update: {},
                create: { name }
            });
        }

        return NextResponse.json({ success: true, message: 'Database initialized', admin: admin.email });
    } catch (error: any) {
        console.error('Setup Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
