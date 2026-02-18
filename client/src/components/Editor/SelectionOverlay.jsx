import { useEffect, useState } from 'react';
import { TransformHandles } from './TransformHandles';
import { boundsToViewRect } from './utils/coordinateConversion';
import { BoundingBox } from './BoundingBox';

export function SelectionOverlay({
    paperCanvasRef, 
    selectedPathIds, 
    getSelectionBounds, 
    zoom, 
    onTransform, 
    onTransformStart, 
    onTransformEnd, 
    panTrigger,
    transformationTrigger
}) {
    const [selectionBounds, setSelectionBounds] = useState([]);
    
    useEffect(() => {
        const scopeRef = paperCanvasRef.current?.getScope();
        // const containerRef = paperCanvasRef.current?.getContainer();

        const canvasBounds = getSelectionBounds(scopeRef);

        if(canvasBounds !== null){
            const viewBounds = boundsToViewRect(canvasBounds, scopeRef.current);
            setSelectionBounds(viewBounds);
        }

    }, [selectedPathIds, zoom, panTrigger, transformationTrigger])
    
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