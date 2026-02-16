export function BoundingBox({bounds, onDrag, onDragStart, onDragEnd}) {
    function clickBox(e){
        if (e.shiftKey) {
            const target = e.currentTarget;
            target.style.pointerEvents = 'none';
            const below = document.elementFromPoint(e.clientX, e.clientY);
            target.style.pointerEvents = 'auto';
            if (below) below.dispatchEvent(new MouseEvent('mousedown', e.nativeEvent));
            return;
        }

        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        function moveBox(e) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            onDrag('move', {x: e.clientX, y: e.clientY}, {deltaX, deltaY});
        }

        function releaseBox(e) {
            document.removeEventListener('mousemove', moveBox);
            document.removeEventListener('mouseup', releaseBox);
            onDragEnd('move', {x: e.clientX, y: e.clientY});
        }

        document.addEventListener('mousemove', moveBox);
        document.addEventListener('mouseup', releaseBox);

        onDragStart('move', {x: startX, y: startY});
    }

    return (
        <div 
            style={{
                position: 'absolute',
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                border: '4px dashed blue',
                cursor: 'move',
                pointerEvents: 'auto'
            }}
            onMouseDown={(e) => clickBox(e)}
        />
    )
}