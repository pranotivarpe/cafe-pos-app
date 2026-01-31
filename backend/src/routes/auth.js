const express = require('express');
const { login, register } = require('../controllers/authController');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, async (req, res) => {
    res.json({ user: req.user });
});


module.exports = router;
