const express = require('express');
const auth = require('../middleware/auth');
const {
    getInventory,
    updateStock,
    getLowStock
} = require('../controllers/inventoryController');

const router = express.Router();

router.use(auth);

router.get('/', getInventory);
router.put('/:id', updateStock);
router.get('/low-stock', getLowStock);

module.exports = router;
