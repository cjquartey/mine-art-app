import { createContext, useState, useEffect } from "react";
import socket from '../socket/socketClient';

const SocketContext = createContext(null);

function SocketProvider({children}) {
    const [isConnected, setIsConnected] = useState(false);
    const [members, setMembers] = useState([]);
    const [locks, setLocks] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        function handlePresenceUpdate(membersInfo) {
            setMembers(membersInfo);
        }
        socket.on('presenceUpdate', handlePresenceUpdate);

        function handleLockSync(roomLocks) {
            setLocks(roomLocks.map(({pathId, lockInfo}) => ({pathId, ...lockInfo})));
        }
        socket.on('lockSync', handleLockSync);

        function handleLockReleased(pathId) {
            setLocks(prevLocks => 
                prevLocks.filter(item => item.pathId !== pathId)
            );
        }
        socket.on('lockReleased', handleLockReleased);

        function handleLockGranted(newLockInfo) {
            setLocks(prevLocks => [...prevLocks, newLockInfo]);
        }
        socket.on('lockGranted', handleLockGranted);

        function handleConnect() {
            setIsConnected(true);
        }
        socket.on('connect', handleConnect);

        function handleDisconnect() {
            setIsConnected(false);
        }
        socket.on('disconnect', handleDisconnect);

        function handleConnectError(err) {
            setError(err.message);
        }
        socket.on('connect_error', handleConnectError);

        return () => {
            socket.off('presenceUpdate', handlePresenceUpdate);
            socket.off('lockSync', handleLockSync);
            socket.off('lockReleased', handleLockReleased);
            socket.off('lockGranted', handleLockGranted);
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
        }
    }, []);

    function joinDocument(drawingId) {
        if(!socket.connected) socket.connect();
        socket.emit('joinDocument', drawingId, (errorMessage) => setError(errorMessage));
    }

    function leaveDocument(drawingId) {
        socket.emit('leaveDocument', drawingId);
        socket.disconnect();

        // Reset state
        setMembers([]);
        setLocks([]);
        setError(null);
    }

    function requestLock(drawingId, pathId) {
        socket.emit('requestLock', drawingId, pathId);
    }

    function releaseLock(drawingId, pathId) {
        socket.emit('releaseLock', drawingId, pathId);
    }

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            members,
            locks,
            error,
            joinDocument,
            leaveDocument,
            requestLock,
            releaseLock
        }}>
            {children}
        </SocketContext.Provider>
    )
}

export {SocketContext, SocketProvider}