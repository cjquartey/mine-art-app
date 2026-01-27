const express = require('express');
const router = express.Router();
const drawingController = require('../controllers/drawingController');
const optionalAuth = require('../middleware/optionalAuth');

// Get guest's drawings
router.get('/session/:sessionId', drawingController.getGuestDrawings);

// Get SVG document metadata
router.get('/:drawingId', optionalAuth, drawingController.getDrawingMetadata);

// Get actual SVG file
router.get('/:drawingId/svg', optionalAuth, drawingController.downloadSVG);

// Delete a drawing
router.delete('/:drawingId', optionalAuth, drawingController.deleteDrawing);

module.exports = router;