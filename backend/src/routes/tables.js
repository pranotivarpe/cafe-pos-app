const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all tables
router.get('/', tableController.getTables);

// Reservation management
router.post('/reserve', tableController.createReservation);
router.delete('/:id/reservation', tableController.cancelReservation);
router.put('/:id/extend', tableController.extendReservation);

// Expiry management
router.post('/release-expired', tableController.releaseExpired);
router.get('/expiring', tableController.getExpiring);

// Update table status
router.put('/:id/status', tableController.updateTableStatus);

module.exports = router;