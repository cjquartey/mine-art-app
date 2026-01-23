const {validateProjectAccess, validateCollaborators} = require('../utils/validators');
const Project = require('../models/Project');
const Drawing = require('../models/Drawing');

async function createProject(req, res) {
    try{
        // Get user id and project name from request
        const {userId} = req.user;
        const {projectName} = req.body;

        // Reject the request if project name is not provided
        if (!projectName) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // Create a new project
        const newProject = await Project.create({
            name: projectName,
            ownerId: userId
        });

        return res.status(201).json({
            success: true,
            message: `${projectName} successfully created!`,
            newProject
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

async function getProjects(req, res) {
    try{
        // Get user id from the request
        const {userId} = req.user;

        // Find all projects that the user owns or is a collaborator on - to be returned as separate objects
        const [userOwnedProjects, userCollabProjects] = await Promise.all([
            Project.find({ownerId: userId}),
            Project.find({collaborators: userId})
        ]);

        const projectCount = userOwnedProjects.length + userCollabProjects.length;

        if(projectCount === 0) {
            return res.status(200).json({
                success: true,
                message: 'No projects'
            });
        }

        return res.status(200).json({
            success: true,
            message: `User has ${projectCount} project(s)`,
            projectCount,
            userOwnedProjects,
            userCollabProjects
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

async function getProjectDetails(req, res) {
    try{
        // Get user and project id from the request
        const {userId} = req.user;
        const {projectId} = req.params;

        // Find the project if it exists, reject the request if it doesn't
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(400).json({
                success: false,
                message: `No project with id ${projectId}`
            });
        }

        // Validate whether the user is authorised to access the project
        const projectAccess = validateProjectAccess(userId, project);

        if (!projectAccess.authorised) {
            return res.status(401).json({
                success: false,
                message: projectAccess.reason
            });
        }

        // Get all drawings that belong to the project
        const projectDrawings = await Drawing.find({projectId});
        
        return res.status(200).json({
            success: true,
            message: `Access to ${project.name} granted!`,
            project,
            projectDrawings      
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

async function updateProject(req, res) {
    try{
        // Get user id from the request
        const {userId} = req.user;

        // Find the project if it exists, reject the request if it doesn't
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(400).json({
                success: false,
                message: `No project with id ${req.params.projectId}`
            });
        }

        // Validate whether the user is authorised to access the project
        const projectAccess = validateProjectAccess(userId, project);

        if (!projectAccess.authorised) {
            return res.status(401).json({
                success: false,
                message: projectAccess.reason
            });
        }

        // Reject the update request if the user is only a collaborator on the project
        if (projectAccess.role === 'Collaborator') {
            return res.status(401).json({
                success: false,
                message: 'Collaborators cannot update projects'
            });
        }

        // With validated ownership, process the update request
        const {name, collaboratorIds} = req.body;
        
        // First, update the project name if it was provided in the request
        if (name) project.name = name;

        // Validate and update the list of collaborators
        if (collaboratorIds) {
            const collabResponseObject = await validateCollaborators(collaboratorIds);

            if (!collabResponseObject.valid){
                return res.status(400).json({
                    success: false,
                    message: `Failed to update collaborators! No user(s) with id: ${collabResponseObject.notFound.join(', ')}`
                });
            }

            project.collaborators = collabResponseObject.userIds;
        }
        await project.save();

        return res.status(200).json({
            success: true,
            message: `${project.name} successfully updated`,
            project
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

async function deleteProject(req, res) {
    try{
        // Get user id from the request
        const {userId} = req.user;

        // Find the project if it exists, reject the request if it doesn't
        const project = await Project.findById(req.params.projectId);

        if (!project) {
            return res.status(400).json({
                success: false,
                message: `No project with id ${req.params.projectId}`
            });
        }

        // Validate whether the user is authorised to access the project
        const projectAccess = validateProjectAccess(userId, project);

        if (!projectAccess.authorised) {
            return res.status(401).json({
                success: false,
                message: projectAccess.reason
            });
        }

        // Reject the delete request if the user is only a collaborator on the project
        if (projectAccess.role === 'Collaborator') {
            return res.status(401).json({
                success: false,
                message: 'Collaborators cannot delete projects'
            });
        }

        // With validated ownership, process the delete request

        // First delete project drawings and their GridFS SVG files
        const drawings = await Drawing.find({projectId: project._id});
        for (const drawing of drawings){
            if (drawing.svgFileId) await deleteFile(drawing.svgFileId);
        }
        await Drawing.deleteMany({projectId: project._id})

        // Finally, delete entire project
        const deletedProject = await Project.findByIdAndDelete(project._id);
        
        return res.status(200).json({
            success: true,
            message: `${deletedProject.name} deleted with its ${resultObject.deletedCount} drawings.`
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectDetails,
    updateProject,
    deleteProject
};