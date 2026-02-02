const prisma = require('../prisma');

// Get all menu items
exports.getMenu = async (req, res, next) => {
    try {
        const menu = await prisma.menuItem.findMany({
            where: { isActive: true },
            include: { category: true, inventory: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(menu);
    } catch (error) {
        next(error);
    }
};

// Add menu item
exports.addItem = async (req, res, next) => {
    try {
        const { name, description, price, categoryId } = req.body;

        // Validation
        if (!name || !price || !categoryId) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        if (parseFloat(price) <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        // Check if category exists
        const categoryExists = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!categoryExists) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Create item
        const item = await prisma.menuItem.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                categoryId: parseInt(categoryId)
            },
            include: { category: true }
        });

        // Create inventory entry
        await prisma.inventory.create({
            data: { menuItemId: item.id, quantity: 0, lowStock: true }
        });

        // Return complete item with inventory
        const itemWithInventory = await prisma.menuItem.findUnique({
            where: { id: item.id },
            include: { category: true, inventory: true }
        });

        res.status(201).json(itemWithInventory);
    } catch (error) {
        next(error);
    }
};

// Update menu item
exports.updateItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, categoryId } = req.body;

        // Validation
        if (price && parseFloat(price) <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        // Update item
        const item = await prisma.menuItem.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(price && { price: parseFloat(price) }),
                ...(categoryId && { categoryId: parseInt(categoryId) })
            },
            include: { category: true, inventory: true }
        });

        res.json(item);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        next(error);
    }
};

// Delete menu item
exports.deleteItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if item exists
        const item = await prisma.menuItem.findUnique({
            where: { id: parseInt(id) },
            include: {
                orderItems: true,
                inventory: true
            }
        });

        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        // Check if item has been ordered
        if (item.orderItems && item.orderItems.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete item with existing orders. Archive it instead.'
            });
        }

        // Delete inventory first (if exists)
        if (item.inventory) {
            await prisma.inventory.delete({
                where: { menuItemId: parseInt(id) }
            });
        }

        // Delete menu item
        await prisma.menuItem.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            message: 'Item deleted successfully',
            id: parseInt(id)
        });
    } catch (error) {
        console.error('Delete error:', error); // DEBUG
        if (error.code === 'P2003') {
            return res.status(400).json({
                error: 'Cannot delete: Item has related records'
            });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        next(error);
    }
};


// Get categories
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { menuItems: true }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        next(error);
    }
};
