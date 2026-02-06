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

// Helper function to check if enough ingredients are available
const checkIngredientAvailability = async (tx, orderItems) => {
    const missingIngredients = [];

    for (const item of orderItems) {
        // Get recipe for this menu item
        const recipe = await tx.menuItemIngredient.findMany({
            where: { menuItemId: item.menuItemId },
            include: {
                ingredient: true,
                menuItem: true
            }
        });

        // If no recipe defined, skip ingredient check
        if (recipe.length === 0) continue;

        // Check each ingredient in the recipe
        for (const recipeItem of recipe) {
            const requiredQty = recipeItem.quantity * item.quantity;

            if (recipeItem.ingredient.currentStock < requiredQty) {
                missingIngredients.push({
                    menuItem: recipeItem.menuItem.name,
                    ingredient: recipeItem.ingredient.name,
                    required: requiredQty,
                    available: recipeItem.ingredient.currentStock,
                    unit: recipeItem.ingredient.unit
                });
            }
        }
    }

    return missingIngredients;
};

// Helper function to deduct ingredients when order is placed
const deductIngredients = async (tx, orderItems, orderId) => {
    for (const item of orderItems) {
        // Get recipe for this menu item
        const recipe = await tx.menuItemIngredient.findMany({
            where: { menuItemId: item.menuItemId },
            include: { ingredient: true }
        });

        // If no recipe, skip (backward compatible with items without recipes)
        if (recipe.length === 0) continue;

        // Deduct each ingredient
        for (const recipeItem of recipe) {
            const totalRequired = recipeItem.quantity * item.quantity;

            // Update ingredient stock
            await tx.ingredient.update({
                where: { id: recipeItem.ingredientId },
                data: {
                    currentStock: { decrement: totalRequired }
                }
            });

            // Log the usage
            await tx.ingredientStockLog.create({
                data: {
                    ingredientId: recipeItem.ingredientId,
                    changeType: 'ORDER_USAGE',
                    quantity: -totalRequired,
                    orderId: orderId,
                    notes: `Used for order #${orderId} - ${item.quantity}x items`
                }
            });
        }
    }
};

// Create new order
exports.createOrder = async (req, res, next) => {
    try {
        const { tableId, orderItems } = req.body;
        if (!tableId || !orderItems || orderItems.length === 0) {
            return res.status(400).json({ error: 'Table and order items are required' });
        }

        // Calculate totals including modifications
        let subtotal = 0;

        for (const item of orderItems) {
            // Base price
            let itemTotal = parseFloat(item.price) * item.quantity;

            // Add modification charges
            if (item.modifications && item.modifications.length > 0) {
                for (const mod of item.modifications) {
                    itemTotal += parseFloat(mod.price || 0) * (mod.quantity || 1) * item.quantity;
                }
            }

            subtotal += itemTotal;
        }

        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        const billNumber = generateBillNumber();

        const order = await prisma.$transaction(async (tx) => {
            // Check ingredient availability
            const missingIngredients = await checkIngredientAvailability(tx, orderItems);

            if (missingIngredients.length > 0) {
                const errorMsg = missingIngredients.map(m =>
                    `${m.menuItem}: Need ${m.required.toFixed(1)}${m.unit} of ${m.ingredient}, only ${m.available.toFixed(1)} available`
                ).join('; ');

                throw new Error(`Insufficient ingredients: ${errorMsg}`);
            }

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    tableId: parseInt(tableId, 10),
                    billNumber,
                    subtotal,
                    tax,
                    total,
                    status: 'PENDING',
                    items: {
                        create: orderItems.map(item => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            price: parseFloat(item.price),
                            notes: item.notes || null
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

            // Add modifications to order items
            for (let i = 0; i < orderItems.length; i++) {
                const item = orderItems[i];
                const createdOrderItem = newOrder.items[i];

                if (item.modifications && item.modifications.length > 0) {
                    for (const mod of item.modifications) {
                        await tx.orderItemModification.create({
                            data: {
                                orderItemId: createdOrderItem.id,
                                modificationId: mod.id,
                                quantity: mod.quantity || 1,
                                price: parseFloat(mod.price || 0)
                            }
                        });
                    }
                }
            }

            // Deduct ingredients
            await deductIngredients(tx, orderItems, newOrder.id);

            // Deduct simple inventory (backward compatible)
            for (const item of orderItems) {
                const inv = await tx.inventory.findUnique({
                    where: { menuItemId: item.menuItemId }
                });

                if (inv && inv.quantity > 0) {
                    await tx.inventory.update({
                        where: { menuItemId: item.menuItemId },
                        data: {
                            quantity: { decrement: item.quantity },
                            lowStock: (inv.quantity - item.quantity) < 10
                        }
                    });
                }
            }

            // Update table status
            await tx.table.update({
                where: { id: parseInt(tableId, 10) },
                data: {
                    status: 'OCCUPIED',
                    currentBill: total,
                    orderTime: new Date(),
                    updatedAt: new Date()
                }
            });

            // Fetch complete order with modifications
            const completeOrder = await tx.order.findUnique({
                where: { id: newOrder.id },
                include: {
                    table: true,
                    items: {
                        include: {
                            menuItem: { include: { category: true } },
                            modifications: {
                                include: { modification: true }
                            }
                        }
                    }
                }
            });

            return completeOrder;
        });

        res.status(201).json({
            message: 'Order created successfully',
            order,
            billNumber
        });
    } catch (error) {
        console.error('Create order error:', error);

        if (error.message && error.message.includes('Insufficient ingredients')) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(500).json({ error: 'Failed to create order: ' + error.message });
    }
};

// Update getOrders to include modifications
exports.getOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: {
                            include: { category: true }
                        },
                        modifications: {
                            include: { modification: true }
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

// Get all tables
exports.getTables = async (req, res, next) => {
    try {
        const tables = await prisma.table.findMany({
            include: {
                orders: {
                    where: { status: { in: ['PENDING', 'PREPARING', 'SERVED'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { id: 'asc' }
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
                status: { in: ['PENDING', 'PREPARING', 'SERVED'] }
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

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status: rawStatus, paymentMode } = req.body;
        const orderId = parseInt(req.params.id, 10);

        if (!Number.isFinite(orderId)) {
            return res.status(400).json({ error: 'Invalid order id' });
        }

        const validStatuses = ['PENDING', 'PREPARING', 'SERVED', 'PAID', 'CANCELLED'];
        const status = String(rawStatus || '').toUpperCase();

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // First, get the order with its table and items
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                table: true,
                items: true,
                deliveryInfo: true
            }
        });

        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updateData = {
            status,
            updatedAt: new Date()
        };

        // If status is PAID, add payment info
        if (status === 'PAID' && paymentMode) {
            updateData.paymentMode = paymentMode;
            updateData.paidAt = new Date();
        }

        // If order is being CANCELLED, refund ingredients
        if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
            await prisma.$transaction(async (tx) => {
                // Refund ingredients
                for (const item of existingOrder.items) {
                    const recipe = await tx.menuItemIngredient.findMany({
                        where: { menuItemId: item.menuItemId },
                        include: { ingredient: true }
                    });

                    for (const recipeItem of recipe) {
                        const refundQty = recipeItem.quantity * item.quantity;

                        await tx.ingredient.update({
                            where: { id: recipeItem.ingredientId },
                            data: {
                                currentStock: { increment: refundQty }
                            }
                        });

                        await tx.ingredientStockLog.create({
                            data: {
                                ingredientId: recipeItem.ingredientId,
                                changeType: 'ADJUSTMENT',
                                quantity: refundQty,
                                orderId: orderId,
                                notes: `Refunded - Order #${orderId} cancelled`
                            }
                        });
                    }
                }
            });
        }

        // Update the order
        const order = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: true
                    }
                },
                deliveryInfo: true
            }
        });

        // Handle table status based on ALL orders for that table
        if ((status === 'PAID' || status === 'CANCELLED') && existingOrder.tableId) {
            const activeOrdersOnTable = await prisma.order.count({
                where: {
                    tableId: existingOrder.tableId,
                    status: {
                        in: ['PENDING', 'PREPARING', 'SERVED']
                    }
                }
            });

            if (activeOrdersOnTable === 0) {
                await prisma.table.update({
                    where: { id: existingOrder.tableId },
                    data: {
                        status: 'AVAILABLE',
                        currentBill: 0,
                        orderTime: null,
                        customerName: null,
                        customerPhone: null,
                        reservedFrom: null,
                        reservedUntil: null,
                        updatedAt: new Date()
                    }
                });
            }
        }

        // Update delivery status if this is a delivery/takeaway order
        if (existingOrder.deliveryInfo && (status === 'PAID' || status === 'CANCELLED')) {
            await prisma.deliveryInfo.update({
                where: { orderId: orderId },
                data: {
                    deliveryStatus: status === 'PAID' ? 'DELIVERED' : 'CANCELLED',
                    actualTime: new Date()
                }
            });
        }

        res.json({
            success: true,
            order,
            tableUpdated: !!existingOrder.tableId
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            error: 'Failed to update order status',
            details: error.message
        });
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