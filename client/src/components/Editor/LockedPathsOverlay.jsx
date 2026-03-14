import { useState, useEffect } from "react";
import { boundsToViewRect } from "./utils/coordinateConversion";

export function LockedPathsOverlay({lock, paperCanvasRef, collabTrigger, zoom, panTrigger}) {
    const [bounds, setBounds] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const scopeRef = paperCanvasRef.current?.getScope();

        if (!scopeRef?.current) return;
        
        const collaboratorBounds = scopeRef.current.project.getItem({name: lock.pathId})?.bounds.clone() || null;

        if (collaboratorBounds !== null){
            const viewBounds = boundsToViewRect(collaboratorBounds, scopeRef.current);
            setBounds(viewBounds);
        }
    }, [lock, paperCanvasRef, collabTrigger, zoom, panTrigger]);

    if (!bounds) return null;

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'absolute',
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                border: `4px solid ${lock.colour}`,
                cursor: 'not-allowed',
                pointerEvents: 'auto'
            }}
        >
            <span style={{
                position: 'absolute',
                top: '-25px',
                left: '0',
                backgroundColor: lock.colour,
                color: 'white',
                padding: '2px 8px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease-in-out'
            }}>
                {isHovered ? lock.username : lock.username[0].toUpperCase()}
            </span>
        </div>
    )
}