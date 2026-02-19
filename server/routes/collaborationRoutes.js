const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/',
    authMiddleware.verifyToken,
    collaborationController.getRequests
);

router.post('/',
    authMiddleware.verifyToken,
    collaborationController.createRequest
);

router.patch('/:collabRequestId/accept',
    authMiddleware.verifyToken,
    collaborationController.acceptRequest
);

router.patch('/:collabRequestId/reject',
    authMiddleware.verifyToken,
    collaborationController.rejectRequest
);

module.exports = router;