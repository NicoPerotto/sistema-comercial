import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ALL_WINDOWS = [
  '/', '/ventas/nueva', '/caja', '/pago-proveedores',
  '/productos', '/categorias', '/proveedores',
  '/metricas', '/caja/semanal', '/ventas', '/pago-proveedores/historial',
  '/caja/historial', '/empleados', '/configuracion/pagos',
  '/sistema/usuarios', '/sistema/perfil', '/sistema/apariencia', '/sistema/roles',
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

    // Roles operativos (editables, isSystem=false salvo ADMIN)
    const ventasWindows = ['/', '/ventas/nueva', '/productos'];
    const vendedorRole = await prisma.role.upsert({
        where: { slug: 'VENDEDOR' },
        update: { showInEmployees: true },
        create: {
            name: 'Vendedor',
            slug: 'VENDEDOR',
            description: 'Personal de ventas en mostrador.',
            isSystem: false,
            showInEmployees: true,
            permissions: JSON.stringify({ windows: ventasWindows }),
        },
    })
    const cajeroRole = await prisma.role.upsert({
        where: { slug: 'CAJERO' },
        update: { showInEmployees: true },
        create: {
            name: 'Cajero',
            slug: 'CAJERO',
            description: 'Manejo de caja diaria.',
            isSystem: false,
            showInEmployees: true,
            permissions: JSON.stringify({ windows: ['/', '/caja', '/ventas/nueva', '/productos'] }),
        },
    })

    // Create Admin (vinculado al rol ADMIN real)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sistema.com' },
        update: { password: await bcrypt.hash('admin', 10), roleId: adminRole.id, role: 'ADMIN', username: 'admin' },
        create: {
            email: 'admin@sistema.com',
            username: 'admin',
            name: 'Administrador',
            role: 'ADMIN',
            roleId: adminRole.id,
            password: await bcrypt.hash('admin', 10),
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
