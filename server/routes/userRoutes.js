const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.get('/search',
    authMiddleware.verifyToken,
    userController.searchUsers
);

router.get('/profile', 
    authMiddleware.verifyToken, 
    userController.getProfile
);

module.exports = router;