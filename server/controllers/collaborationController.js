const CollaborationRequest = require('../models/CollaborationRequest');
const User = require('../models/User');
const Project = require('../models/Project');
const {validateProjectAccess, validateCollaborators} = require('../utils/validators');

async function getRequests(req, res){
    try {
        const {userId} = req.user;
        const [sentCollabRequests, receivedCollabRequests] = await Promise.all([
            CollaborationRequest.find({senderId: userId}).sort({createdAt: 1})
                .populate('recipientId', 'firstName lastName username')
                .populate('projectId', 'name'),
            CollaborationRequest.find({recipientId: userId}).sort({createdAt: 1})
                .populate('senderId', 'firstName lastName username')
                .populate('projectId', 'name')
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

        if (userId === recipientId){
            return res.status(403).json({
                success: false,
                message: 'A user cannot send a collaboration request to themself'
            })
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
                message: 'A pending collaboration request for this user already exists'
            });
        }

        if (project.collaborators.some(id => id.equals(recipientId))) {
            return res.status(403).json({
                success: false,
                message: 'Cannot send a request to an existing collaborator'
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

        // Only pending requests can be accepted
        if(collabRequest.status === 'pending') {
            collabRequest.status = 'accepted';
            await collabRequest.save();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only pending requests can be accepted'
            });
        }

        // Only add a user if they don't already exist in the array
        if (!project.collaborators.some(id => id.equals(userId))) {
            project.collaborators.push(userId);
            await project.save();
        }

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

        // Only pending requests can be rejected
        if(collabRequest.status === 'pending') {
            collabRequest.status = 'rejected';
            await collabRequest.save();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only pending requests can be rejected'
            });
        }

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

async function leaveCollaboration(req, res){
    try {
        const {userId} = req.user;
        const {projectId} = req.params;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `The project for the given request does not exist`
            });
        }

        const projectAccess = validateProjectAccess(userId, project);

        if (!projectAccess.authorised) {
            return res.status(403).json({
                success: false,
                message: projectAccess.reason
            });
        }

        // Only project collaborators can leave a project, owners must delete
        if (projectAccess.role === 'Owner') {
            return res.status(403).json({
                success: false,
                message: 'Owners cannot leave a project'
            });
        }

        project.collaborators.pull(userId);
        await CollaborationRequest.updateOne(
            {projectId: projectId, recipientId: userId, status: 'accepted'},
            {status: 'left'}
        );
        await project.save();

        return res.status(200).json({
            success: true,
            message: `Successfully left ${project.name}`
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
    rejectRequest,
    leaveCollaboration
}