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

        // 2. Create Products
        const products = [
            { id: 'p1', name: 'Coca Cola 1.5L', price: 1200, stock: 50, category: 'Bebidas' },
            { id: 'p2', name: 'Arroz 1kg', price: 850, stock: 100, category: 'Alimentos' },
            { id: 'p3', name: 'Detergente Bio', price: 2100, stock: 30, category: 'Limpieza' },
            { id: 'p4', name: 'Café Molido 500g', price: 3400, stock: 15, category: 'Alimentos' },
        ];

        for (const p of products) {
            await prisma.product.upsert({
                where: { id: p.id },
                update: { stock: p.stock, price: p.price },
                create: p,
            });
        }

        return NextResponse.json({ success: true, message: 'Database initialized', admin: admin.email });
    } catch (error: any) {
        console.error('Setup Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
