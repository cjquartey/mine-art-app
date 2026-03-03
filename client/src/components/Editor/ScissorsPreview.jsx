export function ScissorsPreview({point}) {
    return (
        <div 
            className="absolute inset-0 pointer-events-none"
            style={{
                position: 'absolute',
                left: point.x,
                top: point.y,
                width: '8px',
                height: '8px',
                background: 'red',
                cursor: 'none',
                pointerEvents: 'auto'
            }}
        />
    )
}