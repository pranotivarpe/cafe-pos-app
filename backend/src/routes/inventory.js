const express = require('express');
const auth = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');
const router = express.Router();

router.get('/', auth, inventoryController.getInventory);
router.put('/:id', auth, inventoryController.updateInventory);
router.get('/low-stock', auth, inventoryController.getLowStock);  // ✅ Correct

module.exports = router;


