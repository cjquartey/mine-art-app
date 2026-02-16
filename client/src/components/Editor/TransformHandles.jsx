export function TransformHandles({bounds, onDragStart, onDrag, onDragEnd}) {
    const handles = [
        {type: 'corner-tl', x: bounds.left, y: bounds.top},
        {type: 'corner-tr', x: bounds.left + bounds.width, y: bounds.top},
        {type: 'corner-bl', x: bounds.left, y: bounds.top + bounds.height},
        {type: 'corner-br', x: bounds.left + bounds.width, y: bounds.top + bounds.height},
        {type: 'rotate', x: bounds.left + (bounds.width / 2), y: bounds.top - 30}
    ];

    const baseHandleStyle = {
        position: 'absolute',
        width: '8px',
        height: '8px',
        border: '2px solid blue',
        background: 'white',
        pointerEvents: 'auto',
        transform: 'translate(-50%, -50%)'
    }

    function clickHandle(e, handleType) {
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        function moveHandle(e) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            onDrag(handleType, {x: e.clientX, y: e.clientY}, {deltaX, deltaY});
        }

        function releaseHandle(e) {
            document.removeEventListener('mousemove', moveHandle);
            document.removeEventListener('mouseup', releaseHandle);
            onDragEnd(handleType, {x: e.clientX, y: e.clientY});
        }

        document.addEventListener('mousemove', moveHandle);
        document.addEventListener('mouseup', releaseHandle);
        
        onDragStart(handleType, {x: startX, y: startY});
    }

    return (
        <>
            {handles.map((handlePoint, index) => {
                if (handlePoint.type === 'rotate') return <div 
                    key={index}
                    style={{
                        ...baseHandleStyle,
                        left: handlePoint.x,
                        top: handlePoint.y,
                        cursor: 'grab',
                        borderRadius: '50%'
                    }}
                    onMouseDown={(e) => clickHandle(e, handlePoint.type)}
                />

                else if (handlePoint.type === 'corner-tl' || handlePoint.type === 'corner-br') return <div 
                    key={index}
                    style={{
                        ...baseHandleStyle,
                        left: handlePoint.x,
                        top: handlePoint.y,
                        cursor: 'nwse-resize',
                        borderRadius: '0'
                    }}
                    onMouseDown={(e) => clickHandle(e, handlePoint.type)}
                />

                else if (handlePoint.type === 'corner-tr' || handlePoint.type === 'corner-bl') return <div 
                    key={index}
                    style={{
                        ...baseHandleStyle,
                        left: handlePoint.x,
                        top: handlePoint.y,
                        cursor: 'nesw-resize',
                        borderRadius: '0'
                    }}
                    onMouseDown={(e) => clickHandle(e, handlePoint.type)}
                /> 
            })}
        </>
    )
}