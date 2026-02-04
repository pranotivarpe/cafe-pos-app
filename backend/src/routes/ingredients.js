const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Ingredient CRUD
router.get('/', ingredientController.getIngredients);
router.post('/', ingredientController.createIngredient);
router.put('/:id', ingredientController.updateIngredient);
router.delete('/:id', ingredientController.deleteIngredient);

// Stock management
router.post('/:id/add-stock', ingredientController.addStock);
router.post('/:id/wastage', ingredientController.recordWastage);
router.get('/:id/logs', ingredientController.getStockLogs);
router.get('/alerts/low-stock', ingredientController.getLowStock);

// Recipe management
router.get('/recipe/:menuItemId', ingredientController.getMenuItemRecipe);
router.put('/recipe/:menuItemId', ingredientController.setMenuItemRecipe);

// Check availability - separate routes instead of optional parameter
router.get('/check/:menuItemId', ingredientController.checkAvailability);
router.get('/check/:menuItemId/:quantity', ingredientController.checkAvailability);

module.exports = router;