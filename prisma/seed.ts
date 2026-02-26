import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting seed...')

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sistema.com' },
        update: {},
        create: {
            email: 'admin@sistema.com',
            name: 'Administrador',
            role: 'ADMIN',
            password: 'admin',
        },
    })

    // Create Preventista
    await prisma.user.upsert({
        where: { email: 'prev@sistema.com' },
        update: {},
        create: {
            email: 'prev@sistema.com',
            name: 'Preventista Juan',
            role: 'PREVENTISTA',
            password: '123',
        },
    })

    // Create Category
    const category = await prisma.category.upsert({
        where: { name: 'General' },
        update: {},
        create: {
            name: 'General',
            icon: 'Package',
        },
    })

    // Create Product
    const product = await prisma.product.upsert({
        where: { id: 'prod-1' },
        update: {},
        create: {
            id: 'prod-1',
            name: 'Producto Ejemplo',
            categoryId: category.id,
            price: 1500.00,
            stock: 50,
        },
    })

    console.log('Seed completed:', { admin: admin.email, product: product.name })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('Seed failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
