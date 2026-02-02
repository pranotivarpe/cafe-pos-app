const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        // orderItems format: [{ menuItemId: 1, quantity: 2, price: 50 }]

        // Validation
        if (!tableId || !orderItems || orderItems.length === 0) {
            return res.status(400).json({ error: 'Table and order items are required' });
        }

        // Check stock availability for all items
        for (const item of orderItems) {
            const inventory = await prisma.inventory.findUnique({
                where: { menuItemId: item.menuItemId }
            });

            if (!inventory) {
                const menuItem = await prisma.menuItem.findUnique({
                    where: { id: item.menuItemId }
                });
                return res.status(400).json({
                    error: `No inventory found for ${menuItem?.name}`
                });
            }

            if (inventory.quantity < item.quantity) {
                const menuItem = await prisma.menuItem.findUnique({
                    where: { id: item.menuItemId }
                });
                return res.status(400).json({
                    error: `Insufficient stock for ${menuItem?.name}. Available: ${inventory.quantity}`
                });
            }
        }

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) =>
            sum + (parseFloat(item.price) * item.quantity), 0
        );
        const tax = subtotal * 0.05; // 5% GST
        const total = subtotal + tax;

        // Generate bill number
        const billNumber = generateBillNumber();

        // Create order in transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    tableId: parseInt(tableId),
                    billNumber,
                    subtotal,
                    tax,
                    total,
                    status: 'pending',
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
                            menuItem: {
                                include: { category: true }
                            }
                        }
                    }
                }
            });

            // Deduct inventory
            for (const item of orderItems) {
                await tx.inventory.update({
                    where: { menuItemId: item.menuItemId },
                    data: {
                        quantity: { decrement: item.quantity },
                        lowStock: {
                            set: await tx.inventory.findUnique({
                                where: { menuItemId: item.menuItemId }
                            }).then(inv => (inv.quantity - item.quantity) < 10)
                        }
                    }
                });
            }

            // Update table status to occupied
            await tx.table.update({
                where: { id: parseInt(tableId) },
                data: { status: 'occupied' }
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
        next(error);
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
            orderBy: { number: 'asc' }
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
// Update the updateOrderStatus function
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, paymentMode } = req.body;
        const orderId = parseInt(req.params.id);

        const updateData = { status };

        // Add payment details if status is paid
        if (status === 'paid' && paymentMode) {
            updateData.paymentMode = paymentMode;
            updateData.paidAt = new Date();
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                table: true,
                items: {
                    include: { menuItem: true }
                }
            }
        });

        // Free table if paid or cancelled
        if (status === 'paid' || status === 'cancelled') {
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: 'available' }
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
        const { status } = req.body;

        const table = await prisma.table.update({
            where: { id: parseInt(id) },
            data: { status },
            include: { orders: true }
        });

        res.json(table);
    } catch (error) {
        next(error);
    }
};
