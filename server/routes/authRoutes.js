const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validateAuth = require('../middleware/validateAuth');

router.post('/login', 
    ...validateAuth.validateLogin, 
    authController.login
);
router.post('/register', 
    ...validateAuth.validateRegister, 
    authController.register
);

router.get('/profile', 
    authMiddleware.verifyToken, 
    authController.getProfile
);

module.exports = router;