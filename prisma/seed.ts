import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ALL_WINDOWS = [
  '/', '/ventas/nueva', '/caja', '/pago-proveedores',
  '/productos', '/categorias', '/proveedores',
  '/metricas', '/caja/semanal', '/ventas', '/pago-proveedores/historial',
  '/caja/historial', '/empleados', '/configuracion/pagos',
  '/sistema/apariencia', '/sistema/roles',
]

async function main() {
    console.log('Starting seed...')

    // Roles del sistema (no editables/eliminables desde la UI)
    const ownerRole = await prisma.role.upsert({
        where: { slug: 'OWNER' },
        update: { permissions: JSON.stringify({ windows: ALL_WINDOWS }) },
        create: {
            name: 'Owner',
            slug: 'OWNER',
            description: 'Dueño del sistema: acceso total a todas las ventanas y configuración.',
            isSystem: false,
            permissions: JSON.stringify({ windows: ALL_WINDOWS }),
        },
    })

    const adminRole = await prisma.role.upsert({
        where: { slug: 'ADMIN' },
        update: {},
        create: {
            name: 'Administrador',
            slug: 'ADMIN',
            description: 'Administrador: acceso total a operaciones y administración.',
            isSystem: true,
            permissions: JSON.stringify({ windows: ALL_WINDOWS }),
        },
    })

    const managerRole = await prisma.role.upsert({
        where: { slug: 'MANAGER' },
        update: {},
        create: {
            name: 'Encargado',
            slug: 'MANAGER',
            description: 'Encargado: control de stock y ventanas.',
            isSystem: false,
            permissions: JSON.stringify({ windows: ALL_WINDOWS.filter((w) => !w.startsWith('/sistema')) }),
        },
    })

    // Create Admin (asociado al rol OWNER)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sistema.com' },
        update: { password: await bcrypt.hash('admin', 10), roleId: ownerRole.id, username: 'admin' },
        create: {
            email: 'admin@sistema.com',
            username: 'admin',
            name: 'Administrador',
            role: 'ADMIN',
            roleId: ownerRole.id,
            password: await bcrypt.hash('admin', 10),
        },
    })

    // Create Preventista
    await prisma.user.upsert({
        where: { email: 'prev@sistema.com' },
        update: { password: await bcrypt.hash('123', 10), username: 'juan' },
        create: {
            email: 'prev@sistema.com',
            username: 'juan',
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

    // Configuración de branding por defecto (singleton)
    await prisma.systemConfig.upsert({
        where: { id: 'singleton' },
        update: {},
        create: {
            id: 'singleton',
            brandName: 'PPG Gestión Comercial',
            description: 'Sistema avanzado de gestión comercial, stock y ventas',
            sidebarTitle: 'PPG',
            sidebarSubtitle: 'Gestión Comercial',
            theme: 'warm-sand',
        },
    })

    console.log('Seed completed:', {
        admin: admin.email,
        roles: [ownerRole.slug, adminRole.slug, managerRole.slug],
        product: product.name,
    })
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
