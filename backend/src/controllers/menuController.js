const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMenu = async (req, res) => {
    const menu = await prisma.menuItem.findMany({
        include: { category: true, inventory: true }
    });
    res.json(menu);
};

exports.addItem = async (req, res) => {
    const { name, description, price, categoryId } = req.body;
    const item = await prisma.menuItem.create({
        data: { name, description, price, categoryId },
        include: { category: true }
    });
    await prisma.inventory.create({
        data: { menuItemId: item.id, quantity: 0 }
    });
    res.json(item);
};
