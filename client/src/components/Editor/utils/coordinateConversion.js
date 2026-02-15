export function projectToScreen(point, scope, containerElement) {
    const viewPoint = scope.view.projectToView(point);
    const rect = containerElement.getBoundingClientRect();

    const screenPoint = {
        x: rect.left + viewPoint.x,
        y: rect.top + viewPoint.y,
    }
    
    return screenPoint;
}

export function screenToProject(screenX, screenY, scope, containerElement) {
    const rect = containerElement.getBoundingClientRect();

    const viewX = screenX - rect.left;
    const viewY = screenY - rect.top;

    const projectPoint = scope.view.viewToProject(new scope.Point(viewX, viewY));
    return projectPoint;
}

export function boundsToScreenRect(paperBounds, scope, containerElement) {
    const topLeft = projectToScreen(paperBounds.topLeft, scope, containerElement);
    const bottomRight = projectToScreen(paperBounds.bottomRight, scope, containerElement);

    const screenRect = {
        left: topLeft.x,
        top: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
    }

    return screenRect;
}