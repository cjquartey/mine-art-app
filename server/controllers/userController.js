const User = require('../models/User');

async function searchUsers(req, res) {
    try {
        const {userId} = req.user;
        const query = req.query.q?.trim() || '';

        if (!query) {
            return res.status(200).json({
                success: true,
                users: []
            });
        }

        const users = await User.find({
            _id: {$ne: userId},
            $or: [
                {username: {$regex: query, $options: 'i'}},
                {firstName: {$regex: query, $options: 'i'}},
                {lastName: {$regex: query, $options: 'i'}}
            ]
        }).select('_id username firstName lastName').limit(20);

        return res.status(200).json({
            success: true,
            message: `Found ${users.length} user(s)`,
            users
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Handle profile extraction logic
async function getProfile(req, res) {
    try {
        // Extract data from the request
        const {userId} = req.user;
        
        // Attempt to find a user with given data
        const foundUser = await User.findOne({_id: userId});

        // Return an error if no user is found
        if (!foundUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Send successful response with user data
        return res.status(200).json({
            success: true,
            message: 'User found',
            user: {
                userId: foundUser._id,
                username: foundUser.username,
                email: foundUser.email,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName
            }
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    searchUsers,
    getProfile
}