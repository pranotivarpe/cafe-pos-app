const prisma = require('../prisma');

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

        const parsedId = parseInt(id, 10);
        const q = Number(quantity);

        if (!Number.isFinite(parsedId) || !Number.isFinite(q) || q < 0) {
            return res.status(400).json({ error: 'Invalid table id or quantity' });
        }

        const inventory = await prisma.inventory.update({
            where: { id: parsedId },
            data: {
                quantity: Math.floor(q),
                lowStock: Math.floor(q) < 10 // Auto-detect low stock
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
