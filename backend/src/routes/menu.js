const express = require('express');
const auth = require('../middleware/auth');
const {
    getMenu,
    addItem,
    updateItem,
    deleteItem,
    getCategories
} = require('../controllers/menuController');

const router = express.Router();

router.use(auth); // All protected

router.get('/items', getMenu);
router.post('/items', addItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);
router.get('/categories', getCategories);

module.exports = router;
