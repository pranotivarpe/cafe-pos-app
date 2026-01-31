const express = require('express');
const auth = require('../middleware/auth');
const { getMenu, addItem } = require('../controllers/menuController');
const router = express.Router();

router.use(auth);  // All protected
router.get('/', getMenu);
router.post('/', addItem);

module.exports = router;
