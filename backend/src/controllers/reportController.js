const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.$transaction([
        prisma.order.aggregate({
            where: { createdAt: { gte: today }, status: 'paid' },
            _sum: { total: true },
            _count: true
        }),
        prisma.orderItem.aggregate({
            _count: true
        }),
        prisma.inventory.count({
            where: { lowStock: true }
        }),
        prisma.menuItem.findMany({
            where: { inventory: { lowStock: true } },
            include: { inventory: true }
        })
    ]);

    res.json({
        todaySales: stats[0]._sum.total || 0,
        todayOrders: stats[0]._count,
        totalItemsSold: stats[1]._count,
        lowStockCount: stats[2],
        lowStockItems: stats[3]
    });
};

exports.getSalesReport = async (req, res) => {
    const { from, to } = req.query;
    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: new Date(from),
                lte: new Date(to)
            },
            status: 'paid'
        },
        include: { table: true, items: { include: { menuItem: true } } }
    });
    res.json(orders);
};
