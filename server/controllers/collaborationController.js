const CollaborationRequest = require('../models/CollaborationRequest');
const User = require('../models/User');
const Project = require('../models/Project');
const {validateProjectAccess, validateCollaborators} = require('../utils/validators');

async function getRequests(req, res){
    try {
        const {userId} = req.user;
        const [sentCollabRequests, receivedCollabRequests] = await Promise.all([
            CollaborationRequest.find({senderId: userId}),
            CollaborationRequest.find({recipientId: userId})
        ]);

        const totalRequestsCount = sentCollabRequests.length + receivedCollabRequests.length;

        return res.status(200).json({
            success: true,
            message: `User has ${totalRequestsCount} request(s)`,
            totalRequestsCount,
            sentCollabRequests,
            receivedCollabRequests
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function createRequest(req, res){
    try {
        const {userId} = req.user;
        const {recipientId, projectId} = req.body;

        const recipient = await User.findById(recipientId);
        const project = await Project.findById(projectId);

        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: `No user with id ${recipientId}`
            });
        }

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `No project with id ${projectId}`
            });
        }

        // Validate whether the user is authorised to access the project
        const projectAccess = validateProjectAccess(userId, project);
        if (!projectAccess.authorised) {
            return res.status(403).json({
                success: false,
                message: projectAccess.reason
            });
        }

        // Only project owners have permission to add collaborators
        if (projectAccess.role === 'Collaborator') {
            return res.status(403).json({
                success: false,
                message: 'Collaborators cannot update projects'
            });
        }

        const existingRequest = await CollaborationRequest.findOne({
            senderId: userId,
            recipientId,
            projectId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(409).json({
                success: false,
                message: 'A collaboration request for this user already exists'
            });
        }

        await CollaborationRequest.create({
            senderId: userId,
            recipientId,
            projectId,
            status: 'pending'
        });

        return res.status(201).json({
            success: true,
            message: 'New collaboration request created'
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function acceptRequest(req, res){
    try {
        const {userId} = req.user;
        const {collabRequestId} = req.params;

        const collabRequest = await CollaborationRequest.findById(collabRequestId);

        if (!collabRequest) {
            return res.status(404).json({
                success: false,
                message: `No collaboration request with id ${collabRequestId}`
            });
        }

        const project = await Project.findById(collabRequest.projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `The project for the given request does not exist`
            });
        }

        if (userId.toString() !== collabRequest.recipientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'User is not the intended recipient of this collaboration request'
            });
        }

        collabRequest.status = 'accepted';
        await collabRequest.save();
        project.collaborators.push(userId);
        await project.save();

        return res.status(200).json({
            success: true,
            message: 'Collaboration request accepted'
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function rejectRequest(req, res){
    try {
        const {userId} = req.user;
        const {collabRequestId} = req.params;

        const collabRequest = await CollaborationRequest.findById(collabRequestId);

        if (!collabRequest) {
            return res.status(404).json({
                success: false,
                message: `No collaboration request with id ${collabRequestId}`
            });
        }

        if (userId.toString() !== collabRequest.recipientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'User is not the intended recipient of this collaboration request'
            });
        }

        collabRequest.status = 'rejected';
        await collabRequest.save();

        return res.status(200).json({
            success: true,
            message: 'Collaboration request rejected'
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    getRequests,
    createRequest,
    acceptRequest,
    rejectRequest
}