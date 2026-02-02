const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tables - Dashboard
router.get('/', async (req, res) => {
    try {
        const tables = await prisma.table.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                currentBill: true,
                orderTime: true,
                customerName: true,
                customerPhone: true,
                reservedUntil: true
            }
        });
        res.json(tables);
    } catch (error) {
        console.error('Tables fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});

// POST /api/tables/reserve - Reservation
router.post('/reserve', async (req, res) => {
    const { tableId, customerName, customerPhone, reservedUntil } = req.body;
    try {
        await prisma.table.update({
            where: { id: parseInt(tableId) },
            data: {
                status: 'RESERVED',
                customerName,
                customerPhone,
                reservedUntil
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reserve table' });
    }
});

// PATCH /api/tables/:id/status - Clear table
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await prisma.table.update({
            where: { id: parseInt(req.params.id) },
            data: {
                status,
                currentBill: 0,
                orderTime: null,
                customerName: null,
                customerPhone: null,
                reservedUntil: null
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update table' });
    }
});

module.exports = router;
