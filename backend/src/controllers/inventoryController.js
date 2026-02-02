const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all inventory
exports.getInventory = async (req, res, next) => {
    try {
        const inventory = await prisma.inventory.findMany({
            include: { menuItem: { include: { category: true } } }
        });
        res.json(inventory);
    } catch (error) {
        next(error);
    }
};

// Update stock quantity
exports.updateStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const inventory = await prisma.inventory.update({
            where: { id: parseInt(id) },
            data: {
                quantity: parseInt(quantity),
                lowStock: parseInt(quantity) < 10 // Auto-detect low stock
            },
            include: { menuItem: true }
        });

        res.json(inventory);
    } catch (error) {
        next(error);
    }
};

// Get low stock items
exports.getLowStock = async (req, res, next) => {
    try {
        const lowStock = await prisma.inventory.findMany({
            where: { lowStock: true },
            include: { menuItem: { include: { category: true } } }
        });
        res.json(lowStock);
    } catch (error) {
        next(error);
    }
};
