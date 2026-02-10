import {useRef, useEffect} from 'react';
import paper from 'paper';

export function PaperCanvas({svgContent, zoom, onZoomChange}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const scopeRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const scope = new paper.PaperScope();
        scope.setup(canvas);
        scopeRef.current = scope;

        // Pan canvas on mouse drag
        scope.view.onMouseDrag = (event) => {
            scope.view.center = scope.view.center.subtract(event.delta);
        }

        // Update canvas size on container resize
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const {width, height} = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                scope.view.viewSize = new paper.Size(width, height);
            }
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            scope.project.clear();
            scope.remove();
        }
    }, []);

    // Load drawing
    useEffect(() => {
        if (svgContent && scopeRef.current) {
            scopeRef.current.project.clear();
            const imported = scopeRef.current.project.importSVG(svgContent);
            if (imported) {
                scopeRef.current.view.center = imported.bounds.center;
            }
        }
    }, [svgContent]);

    // Apply zoom from prop
    useEffect(() => {
        if (scopeRef.current && zoom !== undefined) {
            scopeRef.current.view.zoom = zoom;
        }
    }, [zoom]);

    // Handle wheel zooming
    useEffect(() => {
        const canvas = canvasRef.current;
        function handleWheel(event) {
            event.preventDefault();
            if (scopeRef.current) {
                const newZoom = Math.max(0.1, Math.min(5, scopeRef.current.view.zoom * (1 - event.deltaY * 0.001)));
                onZoomChange?.(newZoom);
            }
        };
        canvas?.addEventListener('wheel', handleWheel, {passive: false});
        return () => {
            canvas?.removeEventListener('wheel', handleWheel);
        }
    }, [onZoomChange]);

    return (
        <div ref={containerRef} className="w-full h-full overflow-hidden">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
}