const crypto = require("crypto");

function getSession(req, res) {
    const sessionId = req.headers['x-session-id']
    if (sessionId) return sessionId;
    else{
        const generatedSessionId = generateSessionId();
        res.setHeader('x-session-id', generatedSessionId);
        return generatedSessionId;
    };
};

function generateSessionId() {
    const uuid = crypto.randomUUID();
    return `guest_${uuid}`;
};

module.exports = getSession;