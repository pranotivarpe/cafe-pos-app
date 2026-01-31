const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const hashed = bcrypt.hashSync('owner123', 12);  // Change password!
    await prisma.user.upsert({
        where: { email: 'owner@cafepos.com' },
        update: {},
        create: { email: 'owner@cafepos.com', password: hashed, role: 'owner' }
    });
    console.log('Owner seeded!');
}

main().finally(() => prisma.$disconnect());
