const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Handle registration logic
async function register(req, res) {
    try {
        // Extract data from the request body
        const {firstName, lastName, username, email, password} = req.body;

        // Check if an account already exists with the given username or email
        const existingUser = await User.findOne({$or: [{email}, {username}]});

        // Reject the request if an account exists
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            if (existingUser.username === username) {
                return res.status(409).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user and store in the database
        const newUser = await User.create({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword
        });

        // Create access token for immediate login after registration
        const accessToken = generateToken(newUser._id);

        // Send successful response with user data and access token
        return res.status(201).json({
            success: true,
            message: `User ${username} successfully created!`,
            user: {userId: newUser._id, username},
            accessToken
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

// Handle login logic
async function login(req, res) {
    try {
        // Extract data from the request body
        const {email, password} = req.body;

        // Attempt to find a user with given data
        const foundUser = await User.findOne({email}).select('+password');

        // Return an error if no user is found
        if (!foundUser) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Return an error if the submitted password doesn't match the stored one
        const matchingPassword = await bcrypt.compare(password, foundUser.password);
        if (!matchingPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate access token after validating credentials
        const accessToken = generateToken(foundUser._id);

        // Send successful response with user data and access token
        return res.status(200).json({
            success: true,
            message: `User ${foundUser.username} successfully logged in!`,
            user: {userId: foundUser._id, username: foundUser.username},
            accessToken
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

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

// Helper function to generate an access token
function generateToken(userId){
    return jwt.sign(
        {'userId': userId}, 
        process.env.JWT_SECRET, 
        {expiresIn: process.env.JWT_EXPIRE}
    );
};

module.exports = {
    register,
    login,
    getProfile
}