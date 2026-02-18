export function projectToView(point, scope) {
    const viewPoint = scope.view.projectToView(point);
    return (viewPoint);
}

export function screenToProject(screenX, screenY, scope, containerElement) {
    const rect = containerElement.getBoundingClientRect();

    const viewX = screenX - rect.left;
    const viewY = screenY - rect.top;

    const projectPoint = scope.view.viewToProject(new scope.Point(viewX, viewY));
    return projectPoint;
}

export function boundsToViewRect(paperBounds, scope) {
    const topLeft = projectToView(paperBounds.topLeft, scope);
    const bottomRight = projectToView(paperBounds.bottomRight, scope);

    const viewRect = {
        left: topLeft.x,
        top: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
    }

    return viewRect;
}