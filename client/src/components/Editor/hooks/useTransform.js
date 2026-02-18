import { useRef } from "react";
import { calculateScaleFromCorner, calculateRotationAngle, constrainAspectRatio } from "../utils/transformCalculations";
import { screenToProject } from "../utils/coordinateConversion";

export function useTransform() {
    const transformDataRef = useRef(null);

    function startTransform(type, initialData) {
        transformDataRef.current = {
            type,
            corner: initialData.corner,
            previousPosition: initialData.position,
            previousScale: 1,
            previousBounds: initialData.originalBounds,
            centerX: initialData.originalBounds.left + (initialData.originalBounds.width / 2),
            centerY: initialData.originalBounds.top + (initialData.originalBounds.height / 2)
        }
    }

    function updateTransform(paperCanvasRef, currentPosition) {
        const scope = paperCanvasRef.current?.getScope().current;
        const container = paperCanvasRef.current?.getContainer().current;
        const transformData = transformDataRef.current;
        
        if (!scope || !container || !transformData) return;

        if (transformData.type === 'move') {        
            const {previousPosition} = transformData;
            const previousCanvasPos = screenToProject(previousPosition.x, previousPosition.y, scope, container);
            const currentCanvasPos = screenToProject(currentPosition.x, currentPosition.y, scope, container);
            const delta = currentCanvasPos.subtract(previousCanvasPos);

            transformData.delta = delta;
            transformData.previousPosition = currentPosition;
        }
        else if (transformData.type === 'rotate') {
            const {centerX, centerY, previousPosition} = transformData;
            const previousCanvasPos = screenToProject(previousPosition.x, previousPosition.y, scope, container);
            const currentCanvasPos = screenToProject(currentPosition.x, currentPosition.y, scope, container);

            const centerCanvas = scope.view.viewToProject(new scope.Point(centerX, centerY));

            const rotationDelta = calculateRotationAngle({x: centerCanvas.x, y: centerCanvas.y}, currentCanvasPos, previousCanvasPos);

            transformData.rotationDelta = rotationDelta;
            transformData.centerCanvas = centerCanvas;
            transformData.previousPosition = currentPosition;
        }
        else if (transformData.type === 'scale'){
            const rect = container.getBoundingClientRect();
            const currentViewPos = {
                x: currentPosition.x - rect.left,
                y: currentPosition.y - rect.top
            }

            const {scaleX, scaleY, pivot} = calculateScaleFromCorner(transformData.corner, transformData.previousBounds, currentViewPos);
            const uniformScale = constrainAspectRatio(scaleX, scaleY);

            const pivotCanvas = scope.view.viewToProject(new scope.Point(pivot.x, pivot.y));
            
            transformData.pivotCanvas = pivotCanvas
            transformData.incrementalScale = uniformScale/transformData.previousScale;
            transformData.previousScale = uniformScale
        }
    }

    function applyTransform(paperCanvasRef, selectedPathIds) {
        const scope = paperCanvasRef.current?.getScope().current;
        const transformData = transformDataRef.current;
        
        if (!transformData || !scope) return;

        if (transformData.type === 'move') {            
            selectedPathIds.forEach(pathId => {
                const path = scope.project.getItem({name: pathId});
                if (path) path.translate(transformData.delta);
            });
        }
        
        else if (transformData.type === 'rotate') {
            selectedPathIds.forEach(pathId => {
                const path = scope.project.getItem({name: pathId});
                if (path) path.rotate(transformData.rotationDelta, transformData.centerCanvas);
            });
        }

        else if (transformData.type === 'scale') {
           selectedPathIds.forEach(pathId => {
                const path = scope.project.getItem({name: pathId});
                if (path) path.scale(transformData.incrementalScale, transformData.pivotCanvas)
            });
        }
    }

    function cancelTransform() {
        transformDataRef.current = null;
    }

    return {
        startTransform,
        updateTransform,
        applyTransform,
        cancelTransform
    }
}