const express = require('express');
const router = express.Router();
const optionalAuth = require('../middleware/optionalAuth');
const uploadController = require('../controllers/uploadController');
const {handleUpload} = require('../utils/validators');
const upload = require('../middleware/upload');

// Upload and process image
router.post('/',
    optionalAuth,
    handleUpload(upload),
    uploadController.uploadAndProcess
);

module.exports = router;