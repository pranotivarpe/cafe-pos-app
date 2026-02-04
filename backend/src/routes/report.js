const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// All reports routes require authentication
router.get('/stats', auth, reportController.getStats);
router.get('/sales', auth, reportController.getSalesTrend);
router.get('/category-sales', auth, reportController.getCategorySales);
router.get('/hourly-sales', auth, reportController.getHourlySales);

module.exports = router;