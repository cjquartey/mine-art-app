const jwt = require('jsonwebtoken');

function verifyToken(socket, next){
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.data.user = {
            userId: decoded.userId,
            username: decoded.username
        };

        next();
    } catch(error) {
        return next(new Error('Authentication error: Invalid or expired token'));
    }
}

module.exports = verifyToken