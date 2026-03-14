const roomsMap = new Map();

function addMember(drawingId, socketId, userInfo) {
    // adds to the members map
    const room = getRoom(drawingId);
    room.members.set(socketId, {...userInfo, colour: getUserColour(room.colourPool)});
}

function removeMember(drawingId, socketId) {
    // removes from members map, then checks if the room is now empty and deletes it from rooms entirely if so
    if (roomsMap.has(drawingId)) {
        const room = getRoom(drawingId);
        const userColour = room.members.get(socketId)?.colour;
        room.colourPool.some(option => {
            if (option.colour === userColour) {
                option.taken = false;
                return true;
            }
            return false;
        });
        room.members.delete(socketId);
        if (room.members.size === 0) roomsMap.delete(drawingId);
    }
}

function getMembers(drawingId) {
    // returns the members map as a plain array (easier to serialize and send over the socket)
    if (roomsMap.has(drawingId) ){
        const {members} = getRoom(drawingId);
        return [...members.values()];
    }
    return [];
}

function acquireLock(drawingId, pathId, lockInfo) {
    // checks if the pathId key exists in locks; if not, sets it and returns true; if yes, returns false
    if (roomsMap.has(drawingId)) {
        const {locks} = getRoom(drawingId);
        if (!locks.has(pathId)) {
            locks.set(pathId, lockInfo);
            return true;
        }
        return false;
    }
    return false;
}

function releaseLock(drawingId, pathId, socketId) {
    // only releases if the requesting socketId actually owns the lock
    if (roomsMap.has(drawingId)) {
        const {locks} = getRoom(drawingId);
        if (locks.has(pathId)) {
            const lockInfo = locks.get(pathId);
            if (lockInfo.socketId === socketId) {
                locks.delete(pathId);
                return true;
            }
            return false;
        }
        return false;
    }
    return false;
}

function releaseAllLocks(drawingId, socketId) {
    // called on disconnect; iterates all locks in the room and removes any owned by this socketId, returns an array of the pathIds that were released so the server can broadcast them
    const releasedPathIds = [];
    if (roomsMap.has(drawingId)) {
        const {locks} = getRoom(drawingId);
        locks.forEach((lockInfo, pathId) => {
            if (lockInfo.socketId === socketId) {
                locks.delete(pathId);
                releasedPathIds.push(pathId);
            }
        });
    }
    return releasedPathIds;
}

function getRoomLocks(drawingId) {
    // returns current lock state, useful for sending to a newly joining user so their UI immediately reflects who's editing what
    if (roomsMap.has(drawingId)) {
        const roomLocks = getRoom(drawingId).locks;
        const locksArray = [...roomLocks].map(([pathId, lockInfo]) => ({
            pathId,
            lockInfo
        }));
        return locksArray;
    }
    return [];
}

function getLock(drawingId, pathId) {
    if (roomsMap.has(drawingId)) {
        return getRoom(drawingId).locks.get(pathId);
    }
    return null;
}

function getMember(drawingId, socketId) {
    if (roomsMap.has(drawingId)) {
        return getRoom(drawingId).members.get(socketId);
    }
    return null;
}

// Helper functions
function getRoom(drawingId) {
    // returns the room object, creating it if it doesn't exist yet
    if (!roomsMap.has(drawingId)) roomsMap.set(
        drawingId, {
            members: new Map(), 
            locks: new Map(),
            colourPool: [
                {colour: '#3B82F6', taken: false},
                {colour: '#EC4899', taken: false},
                {colour: '#10B981', taken: false},
                {colour: '#F59E0B', taken: false},
                {colour: '#8B5CF6', taken: false},
                {colour: '#06B6D4', taken: false},
                {colour: '#EF4444', taken: false},
                {colour: '#F472B6', taken: false}
            ]
        });
    return roomsMap.get(drawingId);
}


function getUserColour(colourPool) {
    // Return one of the colour options if it doesn't belong to an existing user
    for (let i = 0; i < colourPool.length; i ++){
        const option = colourPool[i];
        if (!option.taken) {
            option.taken = true;
            return option.colour;
        }
    }

    // Return a random colour if all of the predefined options have been exhausted
    const hexCharacters = '0123456789abcdef';
    let colour = '#';

    for (let i = 0; i < 6; i++) {
        colour += hexCharacters[Math.floor(Math.random() * hexCharacters.length)];
    }

    return colour;
}

module.exports = {
    addMember,
    removeMember,
    getMembers,
    acquireLock,
    releaseLock,
    releaseAllLocks,
    getRoomLocks,
    getLock,
    getMember
}