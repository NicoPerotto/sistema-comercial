import { PrismaClient } from '../src/lib/prisma-client'

const prisma = new PrismaClient()

async function main() {
    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sistema.com' },
        update: {},
        create: {
            email: 'admin@sistema.com',
            name: 'Administrador',
            role: 'ADMIN',
            password: 'admin', // En producción usar bcrypt!
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

    // Create Product
    const product = await prisma.product.upsert({
        where: { id: 'prod-1' }, // ID hardcoded for check
        update: {},
        create: {
            id: 'prod-1',
            name: 'Producto Ejemplo',
            category: 'General',
            price: 1500.00,
            stock: 50,
        },
    })

    console.log({ admin, product })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
