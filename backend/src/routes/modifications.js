const express = require('express');
const router = express.Router();
const modificationController = require('../controllers/modificationController');
const auth = require('../middleware/auth');

router.use(auth);

// Get active modifications (for billing page)
router.get('/', modificationController.getModifications);

// Get all modifications (for admin)
router.get('/all', modificationController.getAllModifications);

// Create modification
router.post('/', modificationController.createModification);

// Update modification
router.put('/:id', modificationController.updateModification);

// Delete modification
router.delete('/:id', modificationController.deleteModification);

// Seed default modifications
router.post('/seed', modificationController.seedModifications);

module.exports = router;