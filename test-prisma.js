const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected.');

        const products = await prisma.product.findMany();
        console.log('Products found:', products.length);
        console.log(JSON.stringify(products, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
