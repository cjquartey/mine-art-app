const jwt = require('jsonwebtoken');

async function verifyToken(req, res, next){
    try {
        // Check if the authorisation header exists
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Extract the token from the authorisation header
        const token = authHeader.split(' ')[1];

        // Check if the token is valid, unexpired, and with the true secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded payload to the request
        req.user = {
            userId: decoded.userId
        }

        next();
    } catch(error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
}

module.exports = {verifyToken};