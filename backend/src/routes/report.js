const express = require('express');
const auth = require('../middleware/auth');
const { getDashboardStats, getSalesReport } = require('../controllers/reportController');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(auth);
router.get('/stats', getDashboardStats);
router.get('/sales', getSalesReport);

router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Today's sales & orders
        const todayOrders = await prisma.order.aggregate({
            where: {
                createdAt: { gte: today }
            },
            _sum: { totalAmount: true },
            _count: true
        });

        // Low stock items
        const lowStock = await prisma.inventory.count({
            where: { lowStock: true }
        });

        // Total items sold (all time)
        const totalItemsSold = await prisma.orderItem.aggregate({
            _sum: { quantity: true }
        });

        res.json({
            todaySales: todayOrders._sum.totalAmount || 0,
            todayOrders: todayOrders._count || 0,
            lowStockCount: lowStock,
            totalItemsSold: totalItemsSold._sum.quantity || 0
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/reports/recent-orders - Recent orders list
router.get('/recent-orders', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const orders = await prisma.order.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: {
                    include: { menuItem: true }
                },
                table: true
            }
        });

        const formattedOrders = orders.map(order => ({
            id: order.id,
            status: order.status || 'completed',
            table: order.table ? order.table.name : 'N/A',
            items: order.orderItems.map(item => item.menuItem.name).join(', '),
            amount: order.totalAmount || 0,
            time: order.createdAt.toLocaleTimeString()
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Recent orders error:', error);
        res.json([]); // Empty array on error
    }
});
module.exports = router;
