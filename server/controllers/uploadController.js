const {Readable} = require('stream');
const fs = require('fs');
const Drawing = require('../models/Drawing');
const Project = require('../models/Project');
const getSession = require('../utils/sessionManager');
const {validateProjectAccess} = require('../utils/validators');
const processImage = require('../services/imageProcessingServices');
const addPathIds = require('../utils/svgProcessor');
const {storeFile} = require('../config/gridfs');

async function uploadAndProcess(req, res) {
    let tempFilePath;
    try {
        // Authentication check
        let userId;
        let sessionId;
        
        if (req.user) userId = req.user.userId;      
        else sessionId = getSession(req, res);
    
        // File validation
        const {file} = req;
        if (!file) return res.status(400).json({
            success: false,
            message: 'No file submitted'
        });

        tempFilePath = req.file?.path;
    
        // Project Validation - only for registered users
        const {projectId} = req.body;
        if (userId && projectId) {
            const project = await Project.findById(projectId);
            if (!project) return res.status(404).json({
                success: false,
                message: `No project with id ${projectId}`
            });
    
            const projectAccess = validateProjectAccess(userId, project);
    
            if (!projectAccess.authorised) return res.status(401).json({
                success: false,
                message: projectAccess.reason
            });
        }
    
        // Reject guest users trying to create a project
        if (!userId && projectId) {
            return res.status(401).json({
                success: false,
                message: 'Guests cannot upload to projects'
            });
        }
    
        // Create drawing document
        const drawingName = req.body.name;
        if (!drawingName) return res.status(400).json({
            success: false,
            message: 'Drawing must have a name'
        });

        // Validate drawing style before saving
        const drawingStyle = req.body.style;
        if (!drawingStyle) return res.status(400).json({
            success: false,
            message: 'A drawing style is required'
        });
    
        let drawing;
    
        // Case 1: Authenticated user with project
        if (userId && projectId) {
            drawing = new Drawing({
                name: drawingName,
                projectId,
                creatorId: userId,
                originalFileName: file.originalname,
                originalFilePath: req.file.path,
                status: 'queued',
                processedStyle: drawingStyle
            });
        }
    
        // Case 2: Authenticated user without project
        else if (userId) {
            drawing = new Drawing({
                name: drawingName,
                creatorId: userId,
                originalFileName: file.originalname,
                originalFilePath: req.file.path,
                status: 'queued',
                processedStyle: drawingStyle
            });
        }
    
        // Case 3: Guest user
        else if (sessionId) {
            drawing = new Drawing({
                name: drawingName,
                sessionId,
                isGuest: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                originalFileName: file.originalname,
                originalFilePath: req.file.path,
                status: 'queued',
                processedStyle: drawingStyle
            });
        }

        await drawing.save();
    
        return res.status(200).json({
            success: true,
            drawingId: drawing._id,
            status: 'queued'
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {uploadAndProcess};