const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Seeding database with dynamic categories and icons...');

        // 1. User
        const admin = await prisma.user.upsert({
            where: { email: 'admin@sistema.com' },
            update: {},
            create: {
                id: 'admin-id',
                name: 'Administrador',
                email: 'admin@sistema.com',
                password: 'admin',
                role: 'ADMIN',
            },
        });
        console.log('Admin user ready:', admin.email);

        // 2. Categories with Icons
        const categoriesData = [
            { id: 'cat1', name: 'Bebidas', icon: 'Drinking' },
            { id: 'cat2', name: 'Alimentos', icon: 'FastFood' },
            { id: 'cat3', name: 'Limpieza', icon: 'Sparkles' },
            { id: 'cat4', name: 'Hogar', icon: 'Home' },
            { id: 'cat5', name: 'Golosinas', icon: 'Sweet' },
            { id: 'cat6', name: 'Otros', icon: 'Package' },
        ];

        for (const cat of categoriesData) {
            await prisma.category.upsert({
                where: { name: cat.name },
                update: { icon: cat.icon },
                create: cat,
            });
        }
        console.log('Categories ready.');

        const dbCategories = await prisma.category.findMany();
        const catMap = Object.fromEntries(dbCategories.map(c => [c.name, c.id]));

        // 3. Products
        const products = [
            { id: 'p1', name: 'Coca Cola 1.5L', categoryName: 'Bebidas', price: 1200, cost: 800, stock: 50 },
            { id: 'p2', name: 'Arroz 1kg', categoryName: 'Alimentos', price: 850, cost: 500, stock: 100 },
            { id: 'p3', name: 'Detergente Bio', categoryName: 'Limpieza', price: 2100, cost: 1500, stock: 30 },
            { id: 'p4', name: 'Café Molido 500g', categoryName: 'Alimentos', price: 3400, cost: 2000, stock: 15 },
        ];

        for (const p of products) {
            await prisma.product.upsert({
                where: { id: p.id },
                update: {
                    stock: p.stock,
                    price: p.price,
                    cost: p.cost,
                    categoryId: catMap[p.categoryName]
                },
                create: {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    cost: p.cost,
                    stock: p.stock,
                    categoryId: catMap[p.categoryName]
                },
            });
        }
        console.log('Products ready.');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
