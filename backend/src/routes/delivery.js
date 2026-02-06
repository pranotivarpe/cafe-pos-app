const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const auth = require('../middleware/auth');

// Protected routes (require login)
router.get('/', auth, deliveryController.getDeliveryOrders);
router.get('/stats', auth, deliveryController.getDeliveryStats);
router.post('/takeaway', auth, deliveryController.createTakeawayOrder);
router.post('/delivery', auth, deliveryController.createDeliveryOrder);
router.put('/:id/status', auth, deliveryController.updateDeliveryStatus);

// Simulation endpoint for testing (protected)
router.post('/simulate', auth, deliveryController.simulateOnlineOrder);

// Webhook routes (no auth - verified by platform signatures)
router.post('/webhook/zomato', deliveryController.zomatoWebhook);
router.post('/webhook/swiggy', deliveryController.swiggyWebhook);

module.exports = router;