const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');


// All menu routes require authentication
router.get('/items', auth, menuController.getMenuItems);
router.get('/categories', auth, menuController.getCategories);
router.post('/items', auth, menuController.createMenuItem);
router.put('/items/:id', auth, menuController.updateMenuItem);
router.delete('/items/:id', auth, menuController.deleteMenuItem);

module.exports = router;
