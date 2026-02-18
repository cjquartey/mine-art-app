// Calculate scale factor from handle movement
export function calculateScaleFromCorner(handleCorner, originalBounds, newCornerPosition){
    const pivot = getOppositePivot(handleCorner, originalBounds);

    const newWidth = Math.max(Math.abs(newCornerPosition.x - pivot.x), 20);
    const newHeight = Math.max(Math.abs(newCornerPosition.y - pivot.y), 20);

    const scaleX = newWidth / originalBounds.width;
    const scaleY = newHeight / originalBounds.height;

    return {scaleX, scaleY, pivot}
}

// Calculate rotation angle from handle position
export function calculateRotationAngle(centerPoint, handlePosition, initialHandlePosition){
    const initialAngle = Math.atan2(initialHandlePosition.y - centerPoint.y, initialHandlePosition.x - centerPoint.x) * (180 / Math.PI);

    const currentAngle = Math.atan2(handlePosition.y - centerPoint.y, handlePosition.x - centerPoint.x) * (180 /Math.PI);

    const rotationDelta = currentAngle - initialAngle;

    return rotationDelta;
}

// Determine which corner is the pivot
export function getOppositePivot(handleCorner, originalBounds) {
    if (handleCorner === 'tl') return {
        // Return coordinates of bottom right corner
        x: originalBounds.left + originalBounds.width, 
        y: originalBounds.top + originalBounds.height
    }

    else if (handleCorner === 'tr') return {
        // Return coordinates of bottom left corner
        x: originalBounds.left, 
        y: originalBounds.top + originalBounds.height
    }

    else if (handleCorner === 'br') return {
        // Return coordinates of top left corner
        x: originalBounds.left, 
        y: originalBounds.top
    }
    
    else if (handleCorner === 'bl') return {
        // Return coordinates of top right corner
        x: originalBounds.left + originalBounds.width, 
        y: originalBounds.top
    }
}

// Constrain aspect ratio if needed
export function constrainAspectRatio(scaleX, scaleY){
    // Currently using the average of scaleX and scaleY but might change to use the dimension that changed more or to always use scaleX
    return (scaleX + scaleY) / 2
}