import {useImperativeHandle, useRef, useEffect} from 'react';
import paper from 'paper';

export function PaperCanvas({
    svgContent,
    zoom,
    onZoomChange,
    toolMode='Select',
    selectedPathIds,
    onPathSelect, 
    onPan,
    ref
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const scopeRef = useRef(null);
    const toolModeRef = useRef(toolMode);
    const onPathSelectRef = useRef(onPathSelect);

    useImperativeHandle(ref, () => ({
        getScope: () => scopeRef,
        getContainer: () => containerRef
    }));

    useEffect(() => {
        toolModeRef.current = toolMode;
        onPathSelectRef.current = onPathSelect;
    }, [toolMode, onPathSelect])

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const scope = new paper.PaperScope();
        scope.setup(canvas);
        scopeRef.current = scope;

        // Handle click events based on the chosen tool
        scope.view.onMouseDown = (event) => {
            if (toolModeRef.current === 'Select') {
                const hitOptions = {
                    segments: true,
                    stroke: true,
                    fill: true,
                    tolerance: 5
                }

                const hitResult = scope.project.hitTest(event.point, hitOptions);
                
                if (hitResult) {
                    console.log('Hit results', hitResult);
                    console.log(`Item name: ${hitResult.item.name}, ItemType: ${(typeof(hitResult.item.name))}`);
                    const targetPath = hitResult.item;
                    console.log('Target path', targetPath);
                    console.log('Target path bounds', targetPath.bounds);
                    const pathId = targetPath.name;
                    onPathSelectRef.current?.(pathId, event.event);
                } else {
                    // Clicked empty area - clear selection
                    onPathSelectRef.current?.(null, event.event);
                }
            }
        }
        // Pan canvas on mouse drag
        scope.view.onMouseDrag = (event) => {
            if (toolModeRef.current === 'Pan') {
                scope.view.center = scope.view.center.subtract(event.delta);
                onPan?.(scope.view.center);
            }
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
                imported.getItems({class: 'Path'}).forEach(path => console.log(`PathId: ${path.name}`));
            }
        }
    }, [svgContent]);

    // Visual feedback for selected paths
    useEffect(() => {
        if (!scopeRef.current) return;

        const paths = scopeRef.current.project.getItems({class: 'Path'});
        paths.forEach(path => {
            const pathId = path.name;
            if (selectedPathIds.has(pathId)) {
                // Store original path styles
                if (!path.data.originalStroke) {
                    path.data.originalStroke = path.strokeColor?.clone();
                    path.data.originalStrokeWidth = path.strokeWidth;
                }
                // Apply selection style
                path.strokeWidth = path.data.originalStrokeWidth + 2;
                path.selected = true;
            } else {
                // Restore original styles
                if (path.data.originalStroke) {
                    path.strokeWidth = path.data.originalStrokeWidth;
                }
                path.selected = false;
            }
        })
    }, [selectedPathIds]);

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