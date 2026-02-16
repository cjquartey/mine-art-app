import { useEffect, useState } from 'react';
import { TransformHandles } from './TransformHandles';
import { boundsToScreenRect } from './utils/coordinateConversion';
import { BoundingBox } from './BoundingBox';

export function SelectionOverlay({
    paperCanvasRef, 
    selectedPathIds, 
    getSelectionBounds, 
    zoom, 
    onTransform, 
    onTransformStart, 
    onTransformEnd, 
    panTrigger
}) {
    const [selectionBounds, setSelectionBounds] = useState([]);
    
    useEffect(() => {
        const scopeRef = paperCanvasRef.current?.getScope();
        // const containerRef = paperCanvasRef.current?.getContainer();

        const canvasBounds = getSelectionBounds(scopeRef);

        if(canvasBounds !== null){
            const screenBounds = boundsToScreenRect(canvasBounds, scopeRef.current);
            setSelectionBounds(screenBounds);
        }

    }, [selectedPathIds, zoom, panTrigger])
    
    if (selectedPathIds.size === 0) return null;
    return (
        <div className="absolute inset-0 pointer-events-none">
            {selectionBounds && (
                <>
                    <BoundingBox
                        bounds={selectionBounds}
                        onDragStart={onTransformStart}
                        onDrag={onTransform}
                        onDragEnd={onTransformEnd}
                    />
                    
                    <TransformHandles 
                        bounds={selectionBounds}
                        onDragStart={onTransformStart}
                        onDrag={onTransform}
                        onDragEnd={onTransformEnd}
                    />
                </>
            )}            
        </div>
    )
}