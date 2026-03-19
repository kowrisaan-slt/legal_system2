const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE;');
        await prisma.$executeRawUnsafe('CREATE SCHEMA public;');
        console.log('Database reset successfully.');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
