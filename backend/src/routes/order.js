const express = require('express');
const auth = require('../middleware/auth');
const {
    createOrder,
    getTables,
    getOrders,
    getActiveOrders,
    updateOrderStatus,
    updateTableStatus
} = require('../controllers/orderController');

const router = express.Router();

router.use(auth);

// Order routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/active', getActiveOrders);
router.put('/:id/status', updateOrderStatus);

// Table routes
router.get('/tables', getTables);
router.put('/tables/:id/status', updateTableStatus);

module.exports = router;
