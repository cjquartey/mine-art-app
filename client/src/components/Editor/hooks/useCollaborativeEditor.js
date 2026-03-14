import { useEffect, useState } from "react";
import { useSocketContext } from "../../../hooks/useSocketContext";
export function useCollaborativeEditor(drawingId, paperCanvasRef) {
    const [collabTrigger, setCollabTrigger] = useState(null);

    const {
        socket,
        isConnected,
        members,
        locks,
        error,
        joinDocument,
        leaveDocument,
        requestLock,
        releaseLock
    } = useSocketContext();

    useEffect(() => {
        joinDocument(drawingId);

        return () => leaveDocument(drawingId);
    }, [drawingId]);

    useEffect(() => {
        function handleReconnect() {
            joinDocument(drawingId);
        }
        socket.io.on('reconnect', handleReconnect);
        return () => socket.io.off('reconnect', handleReconnect);
    }, [drawingId]);

    useEffect(() => {
        function handlePathChanged({pathId, transformData}) {
            paperCanvasRef.current?.updatePath(pathId, transformData);
            setCollabTrigger({active: true});
        }

        socket.on('pathChanged', handlePathChanged);

        return () => socket.off('pathChanged', handlePathChanged);
    }, [paperCanvasRef]);

    function emitPathUpdate(pathId, transformData) {
        if (!isConnected || !transformData) return;

        let payload;
        if (transformData.type === 'move') {
            payload = {
                type: 'move', 
                delta: {
                    x: transformData.delta.x, 
                    y: transformData.delta.y
                }
            };
        } else if (transformData.type === 'rotate') {
            payload = {
                type: 'rotate', 
                rotationDelta: transformData.rotationDelta, centerCanvas: {
                    x: transformData.centerCanvas.x, 
                    y: transformData.centerCanvas.y
                }
            };
        } else if (transformData.type === 'scale') {
            payload = {
                type: 'scale', 
                incrementalScale: transformData.incrementalScale, pivotCanvas: {
                    x: transformData.pivotCanvas.x, 
                    y: transformData.pivotCanvas.y
                }
            };
        }
        if (payload) socket.emit('pathUpdated', drawingId, pathId, payload);
    }

    return {
        isConnected,
        members,
        locks,
        error,
        collabTrigger,
        requestLock: (pathId) => requestLock(drawingId, pathId),
        releaseLock: (pathId) => releaseLock(drawingId, pathId),
        emitPathUpdate
    }
}