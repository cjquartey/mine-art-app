const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateAuth = require('../middleware/validateAuth');

router.post('/login', 
    ...validateAuth.validateLogin, 
    authController.login
);
router.post('/register', 
    ...validateAuth.validateRegister, 
    authController.register
);

module.exports = router;