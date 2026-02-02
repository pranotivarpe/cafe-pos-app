require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = require('../src/prisma');

async function main() {
    console.log('🌱 Starting full seed...');

    // Create owner only if explicit env vars provided (no defaults)
    const ownerEmail = process.env.SEED_OWNER_EMAIL;
    const ownerPassword = process.env.SEED_OWNER_PASSWORD;

    if (ownerEmail && ownerPassword) {
        await prisma.user.upsert({
            where: { email: ownerEmail },
            update: {},
            create: {
                email: ownerEmail,
                password: bcrypt.hashSync(ownerPassword, 12),
                role: 'owner'
            }
        });
        console.log('✅ Owner seeded');
    } else {
        console.log('ℹ️ Skipping owner creation. To create an owner, set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in your environment.');
    }

    // 2. Categories
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
    console.log('✅ Categories seeded');

    // 3. Menu Items
    await prisma.menuItem.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Espresso',
            description: 'Strong coffee shot',
            price: 50.00,
            categoryId: drinks.id,
            isActive: true
        }
    });

    await prisma.menuItem.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Latte',
            description: 'Coffee with steamed milk',
            price: 80.00,
            categoryId: drinks.id,
            isActive: true
        }
    });

    await prisma.menuItem.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: 'Chips',
            description: 'Salty snack',
            price: 30.00,
            categoryId: snacks.id,
            isActive: true
        }
    });
    console.log('✅ Menu items seeded');

    // 4. Inventory
    await prisma.inventory.upsert({
        where: { menuItemId: 1 },
        update: {},
        create: { menuItemId: 1, quantity: 50, lowStock: false }
    });
    await prisma.inventory.upsert({
        where: { menuItemId: 2 },
        update: {},
        create: { menuItemId: 2, quantity: 50, lowStock: false }
    });
    await prisma.inventory.upsert({
        where: { menuItemId: 3 },
        update: {},
        create: { menuItemId: 3, quantity: 100, lowStock: false }
    });
    console.log('✅ Inventory seeded');

    // 5. TABLES - FIXED FOR YOUR SCHEMA
    await prisma.table.deleteMany(); // Clear existing

    await prisma.table.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Table ${i + 1}`,
            status: 'AVAILABLE',
            currentBill: 0
        }))
    });
    console.log('✅ 10 Tables seeded (Table 1-10)');

    console.log('��� FULL SEED COMPLETE!');
}

main()
    .catch((e) => {
        console.error('❌ Seed ERROR:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });