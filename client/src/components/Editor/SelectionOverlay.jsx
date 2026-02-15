import { useEffect, useState } from 'react';
import { TransformHandles } from './TransformHandles';
import { boundsToScreenRect } from './utils/coordinateConversion';

export function SelectionOverlay({
    containerRef, 
    scopeRef, 
    selectedPathIds, 
    getSelectionBounds, 
    zoom, onTransform, 
    onTransformStart, 
    onTransformEnd, 
    panTrigger
}) {
    const [selectionBounds, setSelectionBounds] = useState([]);
    const [combinedSelectionBounds, setCombinedSelectionBounds] = useState(null);
    
    useEffect(() => {
        const {combinedBounds, allBounds} = getSelectionBounds(scopeRef);

        if(combinedBounds !== null && allBounds.length > 0){
            const aggregateBounds = boundsToScreenRect(combinedBounds, scopeRef.current, containerRef.current);
            setCombinedSelectionBounds(aggregateBounds);

            const individualBounds = allBounds.map(bounds => boundsToScreenRect(bounds, scopeRef.current, containerRef.current));
            setSelectionBounds(individualBounds);
        }

    }, [selectedPathIds, zoom, panTrigger])
    
    if (selectedPathIds.size === 0) return null;
    return (
        <div className="absolute inset-0 pointer-events-none">
            {combinedSelectionBounds && (
                <>
                    <div style={{
                        position: 'absolute',
                        left: combinedSelectionBounds.left,
                        top: combinedSelectionBounds.top,
                        width: combinedSelectionBounds.width,
                        height: combinedSelectionBounds.height,
                        border: '4px dashed blue'
                    }} />

                    <TransformHandles 
                        bounds={combinedSelectionBounds}
                        onDragStart={onTransformStart}
                        onDrag={onTransform}
                        onDragEnd={onTransformEnd}
                    />
                </>
            )}
            {selectionBounds.length > 0 && selectionBounds.map((bounds, index) => {
                return (
                    <div key={index}>
                        <div style={{
                            position: 'absolute',
                            left: bounds.left,
                            top: bounds.top,
                            width: bounds.width,
                            height: bounds.height,
                            border: '2px dashed blue'
                        }} />
                        
                        <TransformHandles 
                            bounds={bounds}
                            onDragStart={onTransformStart}
                            onDrag={onTransform}
                            onDragEnd={onTransformEnd}
                        />
                    </div>
                )
            })}
            
        </div>
    )
}