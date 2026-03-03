import { useEffect, useState } from 'react';
import { TransformHandles } from './TransformHandles';
import { boundsToViewRect } from './utils/coordinateConversion';
import { BoundingBox } from './BoundingBox';

export function SelectionOverlay({
    paperCanvasRef, 
    selectedPathIds, 
    getSelectionBounds, 
    zoom, 
    boundsMode,
    onTransform, 
    onTransformStart, 
    onTransformEnd, 
    panTrigger,
    transformationTrigger
}) {
    const [aggregateBounds, setAggregateBounds] = useState([]);
    const [singleBounds, setSingleBounds] = useState([]);
    
    useEffect(() => {
        const scopeRef = paperCanvasRef.current?.getScope();
        // const containerRef = paperCanvasRef.current?.getContainer();

        const {combinedBounds, individualBounds} = getSelectionBounds(scopeRef);

        if(combinedBounds !== null){
            const viewBounds = boundsToViewRect(combinedBounds, scopeRef.current);
            setAggregateBounds(viewBounds);
        }
        if(individualBounds.length > 0){
            const viewBounds = individualBounds.map(({bounds, pathId}) => ({
                bounds: boundsToViewRect(bounds, scopeRef.current),
                pathId
            }));
            setSingleBounds(viewBounds);
        }

    }, [selectedPathIds, zoom, panTrigger, transformationTrigger])
    
    if (selectedPathIds.size === 0) return null;
    return (
        <div className="absolute inset-0 pointer-events-none">
            {boundsMode === 'combined' ? (
                <div>
                    <BoundingBox
                        bounds={aggregateBounds}
                        onDragStart={onTransformStart}
                        onDrag={onTransform}
                        onDragEnd={onTransformEnd}
                    />

                    <TransformHandles 
                        bounds={aggregateBounds}
                        onDragStart={onTransformStart}
                        onDrag={onTransform}
                        onDragEnd={onTransformEnd}
                    />
                </div>
            ) : (
                singleBounds.map(({bounds, pathId}) => {
                    function handleDragStart(handleType, corner, position, originalBounds) {
                        onTransformStart(handleType, corner, position, originalBounds, pathId);
                    }                        
                    return (
                        <div key={pathId}>
                            <BoundingBox
                                bounds={bounds}
                                onDragStart={handleDragStart}
                                onDrag={onTransform}
                                onDragEnd={onTransformEnd}
                            />
                            <TransformHandles
                                bounds={bounds}
                                onDragStart={handleDragStart}
                                onDrag={onTransform}
                                onDragEnd={onTransformEnd}
                            />
                        </div>
                    );
                })
            )}   
        </div>
    )
}