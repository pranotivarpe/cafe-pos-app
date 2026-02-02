const prisma = require('../prisma');

// Generate unique bill number
const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BILL${year}${month}${day}${random}`;
};

// Create new order
exports.createOrder = async (req, res, next) => {
    try {
        const { tableId, orderItems } = req.body;
        if (!tableId || !orderItems || orderItems.length === 0) {
            return res.status(400).json({ error: 'Table and order items are required' });
        }

        // Validate and check stock
        for (const item of orderItems) {
            const inventory = await prisma.inventory.findUnique({
                where: { menuItemId: item.menuItemId }
            });

            if (!inventory) {
                const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
                return res.status(400).json({ error: `No inventory found for ${menuItem?.name || 'item'}` });
            }

            if (inventory.quantity < item.quantity) {
                const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
                return res.status(400).json({
                    error: `Insufficient stock for ${menuItem?.name || 'item'}. Available: ${inventory.quantity}`
                });
            }
        }

        const subtotal = orderItems.reduce((sum, item) =>
            sum + (parseFloat(item.price) * Number(item.quantity)), 0
        );
        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        const billNumber = generateBillNumber();

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    tableId: parseInt(tableId, 10),
                    billNumber,
                    subtotal,
                    tax,
                    total,
                    status: 'pending', // store as uppercase for consistency
                    items: {
                        create: orderItems.map(item => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            price: parseFloat(item.price)
                        }))
                    }
                },
                include: {
                    table: true,
                    items: {
                        include: {
                            menuItem: { include: { category: true } }
                        }
                    }
                }
            });

            // Deduct inventory and compute lowStock
            for (const item of orderItems) {
                const inv = await tx.inventory.findUnique({ where: { menuItemId: item.menuItemId } });
                await tx.inventory.update({
                    where: { menuItemId: item.menuItemId },
                    data: {
                        quantity: { decrement: item.quantity },
                        lowStock: (inv.quantity - item.quantity) < 10
                    }
                });
            }

            // Update table status to OCCUPIED (enum)
            await tx.table.update({
                where: { id: parseInt(tableId, 10) },
                data: { status: 'OCCUPIED' }
            });

            return newOrder;
        });

        res.status(201).json({
            message: 'Order created successfully',
            order,
            billNumber
        });
    } catch (error) {
        console.error('Create order error:', error);
        // give a clear response instead of throwing internals
        return res.status(500).json({ error: 'Failed to create order' });
    }
};

// Get all tables
exports.getTables = async (req, res, next) => {
    try {
        const tables = await prisma.table.findMany({
            include: {
                orders: {
                    where: { status: { in: ['pending', 'preparing', 'served'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { id: 'asc' } // changed from number -> id
        });
        res.json(tables);
    } catch (error) {
        next(error);
    }
};

// Get all orders
exports.getOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: {
                            include: { category: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// Get active orders
exports.getActiveOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['pending', 'preparing', 'served'] }
            },
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status: rawStatus, paymentMode } = req.body;
        const orderId = parseInt(req.params.id, 10);
        if (!Number.isFinite(orderId)) return res.status(400).json({ error: 'Invalid order id' });

        const status = String(rawStatus || '').toLowerCase();

        const updateData = { status };

        if (status === 'PAID' && paymentMode) {
            updateData.paymentMode = paymentMode;
            updateData.paidAt = new Date();
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                table: true,
                items: { include: { menuItem: true } }
            }
        });

        // Free table if paid or cancelled
        if (status === 'PAID' || status === 'CANCELLED') {
            // set table status to AVAILABLE (enum)
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: 'AVAILABLE', currentBill: 0, orderTime: null, customerName: null, customerPhone: null, reservedFrom: null, reservedUntil: null }
            });
        }

        res.json(order);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};


// Update table status
exports.updateTableStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status: rawStatus } = req.body;
        const status = String(rawStatus || '').toUpperCase();

        const updateData = { status };

        if (status === 'AVAILABLE') {
            updateData.currentBill = 0;
            updateData.orderTime = null;
            updateData.customerName = null;
            updateData.customerPhone = null;
            updateData.reservedUntil = null;
            updateData.reservedFrom = null;
        }

        const table = await prisma.table.update({
            where: { id: parseInt(id, 10) },
            data: updateData,
            include: { orders: true }
        });

        res.json(table);
    } catch (error) {
        next(error);
    }
};
