const Project = require('../models/Project');
const User = require('../models/User');
const getSession = require('./sessionManager');
const multer = require('multer');

async function validateCollaborators(userIds) {
    if (!userIds || userIds.length === 0) return{
        valid: true,
        userIds: []
    }
    
    const users = await User.find({_id : {$in: userIds}});

    if (users.length !== userIds.length) {
        const foundIds = users.map(u => u._id.toString());
        const notFound = userIds.filter(id => !foundIds.includes(id.toString()));
        return {
            valid: false,
            notFound
        }
    }

    return {
        valid: true,
        userIds: users.map(user => user._id)
    }
}

function handleUpload(uploadMiddleware) {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    error: `Upload error: ${err.message}`
                });
            }
            else if (err) {
                return res.status(400).json({
                    success: false,
                    error: `Error: ${err.message}`
                });
            }
            next();
        });
    }
}

function validateProjectAccess(userId, project) {
    // Check if user is the owner of the project
    if (userId.toString() === project.ownerId.toString()) return {
        authorised: true,
        role: 'Owner'
    };

    // Check if user is a collaborator of the project
    if (project.collaborators.some(id => id.equals(userId))) return {
        authorised: true,
        role: 'Collaborator'
    };

    return {
        authorised: false,
        reason: "User is neither the owner nor a collaborator on the project"
    };
};

async function validateDrawingAccess(req, res, drawing) {
    try {
        if (req.user?.userId) {
            const {userId} = req.user;
            const drawingCreator = drawing.creatorId;

            // Check if user is the creator
            if (userId.toString() === drawingCreator.toString()) return {authorised: true};

            // Check if user is a collaborator on the drawing's project
            const project = await Project.findById(drawing.projectId)
            if (project && project.collaborators.some(id => id.equals(userId))) return {authorised: true};

            // Check if user is the owner of the project
            if (project && project.ownerId.toString() === userId.toString()) return {authorised: true}

            return {
                authorised: false,
                reason: "User is neither the creator of the drawing nor a collaborator on the drawing's project"
            }
        }
        else {
            const guestSessionId = getSession(req, res);
            const drawingSessionId = drawing.sessionId;
            if (guestSessionId.toString() === drawingSessionId.toString()) return {authorised: true};
            return {
                authorised: false,
                reason: "Session does not match drawing owner"
            }
        }
    } catch (error){
        return {
            authorised: false,
            reason: `Error: ${error}`
        }
    }
};

module.exports = {
    handleUpload,
    validateProjectAccess,
    validateDrawingAccess,
    validateCollaborators
};