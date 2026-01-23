const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const projectController = require('../controllers/projectController');

// Create a project
router.post('/', 
    authMiddleware.verifyToken, 
    projectController.createProject
);

// List all of a user's projects
router.get('/',
    authMiddleware.verifyToken,
    projectController.getProjects
);

// Get a project's details
router.get('/:projectId',
    authMiddleware.verifyToken,
    projectController.getProjectDetails
);

// Update a project
router.put('/:projectId',
    authMiddleware.verifyToken,
    projectController.updateProject
);

// Delete a project
router.delete('/:projectId',
    authMiddleware.verifyToken,
    projectController.deleteProject
);

module.exports = router;