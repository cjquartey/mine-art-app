const Drawing = require('../models/Drawing');
const {validateDrawingAccess} = require('../utils/validators');
const {retrieveFile, deleteFile} = require('../config/gridfs');
const getSession = require('../utils/sessionManager');

async function getDrawingMetadata(req, res){
    try {
        // Get drawing
        const {drawingId} = req.params;
        const drawing = await Drawing.findById(drawingId);

        if (!drawing) return res.status(404).json({
            success: false,
            message: `Drawing with id ${drawingId} not found`
        });

        // Authentication check - validate drawing access
        const drawingAccess = await validateDrawingAccess(req, res, drawing);
        if (!drawingAccess.authorised) return res.status(401).json({
            success: false,
            message: drawingAccess.reason
        });

        return res.status(200).json({
            success: true,
            drawingMetadata: drawing
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function downloadSVG(req, res){
    try {
        // Get drawing
        const {drawingId} = req.params;
        const drawing = await Drawing.findById(drawingId);

        if (!drawing) return res.status(404).json({
            success: false,
            message: `Drawing with id ${drawingId} not found`
        });

        // Authentication check - validate drawing access
        const drawingAccess = await validateDrawingAccess(req, res, drawing);
        if (!drawingAccess.authorised) return res.status(401).json({
            success: false,
            message: drawingAccess.reason
        });

        // Check drawing status
        if (drawing.status !== 'complete') return res.status(400).json({
            success: false,
            message: 'Cannot download uncomplete drawings'
        });

        // Retrieve SVG from GridFS
        let stream;
        try{
            stream = retrieveFile(drawing.svgFileId);
        } catch(error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        res.set({ 
            'Content-Type': 'image/svg+xml',
            'Content-Disposition': `attachment; filename="${drawing.name}.svg"`
        });

        stream.pipe(res);
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function deleteDrawing(req, res){
    try {
         // Get drawing
        const {drawingId} = req.params;
        const drawing = await Drawing.findById(drawingId);

        if (!drawing) return res.status(404).json({
            success: false,
            message: `Drawing with id ${drawingId} not found`
        });

        // Authentication check - validate drawing access
        const drawingAccess = await validateDrawingAccess(req, res, drawing);
        if (!drawingAccess.authorised) return res.status(401).json({
            success: false,
            message: drawingAccess.reason
        });

        // Delete GridFS file
        try{
            await deleteFile(drawing.svgFileId);
        } catch(error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        // Delete Drawing document
        await Drawing.findByIdAndDelete(drawingId);

        return res.status(200).json({
            success: true,
            message: `Drawing with id ${drawingId} successfully deleted`
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function getGuestDrawings(req, res){
    try {
        const {sessionId} = req.params;

        // Find all guest drawings
        const guestDrawings = await Drawing.find({sessionId, isGuest: true}).select('-svgFileId');

        if (guestDrawings.length > 0) {
            return res.status(200).json({
                success: true,
                message: `Found ${guestDrawings.length} drawings`,
                drawings: guestDrawings,
                drawingsCount: guestDrawings.length
            });
        } else {
            return res.status(200).json({
                success: true,
                message: 'Guest has 0 drawings'
            });
        }
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    getDrawingMetadata,
    downloadSVG,
    deleteDrawing,
    getGuestDrawings
}