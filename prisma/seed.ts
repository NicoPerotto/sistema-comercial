import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting seed...')

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sistema.com' },
        update: { password: await bcrypt.hash('admin', 10) },
        create: {
            email: 'admin@sistema.com',
            name: 'Administrador',
            role: 'ADMIN',
            password: await bcrypt.hash('admin', 10),
        },
    })

    // Create Preventista
    await prisma.user.upsert({
        where: { email: 'prev@sistema.com' },
        update: { password: await bcrypt.hash('123', 10) },
        create: {
            email: 'prev@sistema.com',
            name: 'Preventista Juan',
            role: 'PREVENTISTA',
            password: await bcrypt.hash('123', 10),
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
    const product = await (prisma.product as any).upsert({
        where: { id: 'prod-1' },
        update: {},
        create: {
            id: 'prod-1',
            name: 'Producto Ejemplo',
            category: { connect: { id: category.id } },
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
