const Drawing = require('../models/Drawing');
const Project = require('../models/Project');
const roomState = require('./roomState');

function initialiseSocket(io) {
    io.on('connection', (socket) => {
        socket.on('joinDocument', async (drawingId, callback) => {
            const {userId, username} = socket.data.user;

            try{
                const drawing = await Drawing.findById(drawingId);
                if (!drawing) {
                    throw new Error(`Drawing with id ${drawingId} not found`);
                }

                let drawingAuthorisation = false;

                // Check if user is the creator
                if (userId.toString() === drawing.creatorId.toString()) drawingAuthorisation = true;

                // Check if user is a collaborator on the drawing's project
                const project = await Project.findById(drawing.projectId)
                if (project && project.collaborators.some(id => id.equals(userId))) drawingAuthorisation = true;

                // Check if user is the owner of the project
                if (project && project.ownerId.toString() === userId.toString()) drawingAuthorisation = true;

                if (drawingAuthorisation) {
                    socket.join(drawingId);
                    roomState.addMember(drawingId, socket.id, {userId, username, socketId: socket.id});
                    io.to(drawingId).emit('presenceUpdate', roomState.getMembers(drawingId));
                    io.to(socket.id).emit('lockSync', roomState.getRoomLocks(drawingId));
                    callback(null);
                }
                else {
                    throw new Error(`User does not have access to this drawing`);
                }
            } catch(error) {
                callback(error.message);
            }
        });

        socket.on('leaveDocument', (drawingId) => {
            const releasedPathIds = roomState.releaseAllLocks(drawingId, socket.id);
            releasedPathIds.forEach(pathId => io.to(drawingId).emit('lockReleased', pathId));
            roomState.removeMember(drawingId, socket.id);
            socket.leave(drawingId);
            io.to(drawingId).emit('presenceUpdate', roomState.getMembers(drawingId));
        });

        socket.on('requestLock', (drawingId, pathId) => {
            const {userId, username} = socket.data.user;
            const socketId = socket.id;
            const acquiredAt = Date.now();
            const colour = roomState.getMember(drawingId, socketId)?.colour;
            const lockGranted = roomState.acquireLock(drawingId, pathId, {userId, username, socketId, acquiredAt, colour});
            if (lockGranted){
                io.to(drawingId).emit('lockGranted', {
                    pathId,
                    userId,
                    username,
                    socketId,
                    acquiredAt,
                    colour
                });
            }

        });

        socket.on('releaseLock', (drawingId, pathId) => {
            const lockReleased = roomState.releaseLock(drawingId, pathId, socket.id);
            if (lockReleased) io.to(drawingId).emit('lockReleased', pathId);
        });

        socket.on('pathUpdated', (drawingId, pathId, transformData) => {
            const pathLock = roomState.getLock(drawingId, pathId);
            if (pathLock?.socketId === socket.id) {
                socket.to(drawingId).emit('pathChanged', {pathId, transformData})
            }
        })

        socket.on('disconnecting', () => {
            socket.rooms.forEach(roomId => {
                if (roomId === socket.id) return;
                const releasedPathIds = roomState.releaseAllLocks(roomId, socket.id);
                releasedPathIds.forEach(pathId => io.to(roomId).emit('lockReleased', pathId));
                roomState.removeMember(roomId, socket.id);
                io.to(roomId).emit('presenceUpdate', roomState.getMembers(roomId));
            });

        })
    })
}

module.exports = initialiseSocket;