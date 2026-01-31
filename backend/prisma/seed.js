const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    // Owner
    await prisma.user.upsert({
        where: { email: 'owner@cafepos.com' },
        update: {},
        create: {
            email: 'owner@cafepos.com',
            password: bcrypt.hashSync('owner123', 12),
            role: 'owner'
        }
    });

    // Categories
    const drinks = await prisma.category.upsert({
        where: { name: 'Drinks' },
        update: {},
        create: { name: 'Drinks' }
    });

    const snacks = await prisma.category.upsert({
        where: { name: 'Snacks' },
        update: {},
        create: { name: 'Snacks' }
    });

    // Menu Items (create if not exists)
    const espresso = await prisma.menuItem.create({
        data: {
            name: 'Espresso',
            description: 'Strong coffee shot',
            price: 50.00,
            categoryId: drinks.id
        },
        include: { category: true }
    });

    // Inventory
    await prisma.inventory.upsert({
        where: { menuItemId: espresso.id },
        update: {},
        create: {
            menuItemId: espresso.id,
            quantity: 25,
            lowStock: false
        }
    });

    await prisma.menuItem.create({
        data: {
            name: 'Chips',
            description: 'Salty snack',
            price: 30.00,
            categoryId: snacks.id
        }
    });

    console.log('✅ Seeded: Owner + Drinks/Snacks + Espresso (25 stock) + Chips');
}

main()
    .catch(e => {
        console.error('Seed error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
