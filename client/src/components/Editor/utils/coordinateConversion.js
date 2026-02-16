export function projectToScreen(point, scope) {
    const viewPoint = scope.view.projectToView(point);

    const screenPoint = {
        x: viewPoint.x,
        y: viewPoint.y,
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

export function boundsToScreenRect(paperBounds, scope) {
    const topLeft = projectToScreen(paperBounds.topLeft, scope);
    const bottomRight = projectToScreen(paperBounds.bottomRight, scope);

    const screenRect = {
        left: topLeft.x,
        top: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
    }

    return screenRect;
}