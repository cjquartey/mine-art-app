import {useImperativeHandle, useRef, useEffect} from 'react';
import paper from 'paper';

export function PaperCanvas({
    svgContent,
    zoom,
    onZoomChange,
    toolMode='Select',
    selectedPathIds,
    onPathSelect,
    onSelectAll,
    onPathHover,
    onPathSplit, 
    onPan,
    onSVGLoaded,
    ref
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const scopeRef = useRef(null);
    const toolModeRef = useRef(toolMode);
    const onPathSelectRef = useRef(onPathSelect);
    const onPathHoverRef = useRef(onPathHover);

    useImperativeHandle(ref, () => ({
        getScope: () => scopeRef,
        getContainer: () => containerRef,
        getCurrentSVG: () => { return {
            svgString: scopeRef.current.project.exportSVG({asString: true, bounds: 'content'}),
            panOffset: scopeRef.current.project.bounds
                ? scopeRef.current.view.center.subtract(scopeRef.current.project.bounds.center)
                : new paper.Point(0, 0)
        }},
        loadSVG: ({svgString, panOffset}) => {
            scopeRef.current.project.clear();
            const imported = scopeRef.current.project.importSVG(svgString);
            imported.children[0].remove();
            scopeRef.current.view.center = imported.bounds.center.add(panOffset);
        },
        deletePaths: (pathIds) => {
            pathIds.forEach(pathId => {
                const path = scopeRef.current.project.getItem({name: pathId});
                if (path) path.remove();
            })
        },
        duplicatePaths: (pathIds) => {
            const duplicatedPathIds = [];
            pathIds.forEach(pathId => {
                const path = scopeRef.current.project.getItem({name: pathId});
                if (path) {
                    const duplicatedPath = path.clone();
                    duplicatedPath.name = `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
                    duplicatedPath.position.x += Math.random() * (75 - 25) + 25;
                    duplicatedPath.position.y += Math.random() * (30 - 10) + 10;
                    duplicatedPathIds.push(duplicatedPath.name);
                }
            });
            return duplicatedPathIds;
        },
        selectAllPaths: () => {
            const paths = scopeRef.current.project.getItems({
                match: (item) => item instanceof paper.Path || item instanceof paper.CompoundPath
            });
            const pathIds = paths.map(path => path.name);
            onSelectAll(pathIds);
        },
        getAllPathIds: () => {
            const paths = scopeRef.current.project.getItems({
                match: (item) => item instanceof paper.Path || item instanceof paper.CompoundPath
            });
            const pathIds = paths.map(path => path.name);
            return pathIds;
        }
    }));

    const selectedPathIdsRef = useRef(selectedPathIds);

    useEffect(() => {
        toolModeRef.current = toolMode;
        onPathSelectRef.current = onPathSelect;
        onPathHoverRef.current = onPathHover;
        selectedPathIdsRef.current = selectedPathIds;
    }, [toolMode, onPathSelect, onPathHover, selectedPathIds]);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const scope = new paper.PaperScope();
        scope.setup(canvas);
        scopeRef.current = scope;

        let hoveredPath = null;
        let hoverTimeout = null;

        // Handle click events based on the chosen tool
        scope.view.onMouseDown = (event) => {
            if (toolModeRef.current === 'Select') {
                const hitOptions = {
                    stroke: true,
                    fill: true,
                    tolerance: 5
                }

                const hitResults = scope.project.hitTestAll(event.point, hitOptions);
                const hitResult = hitResults.find(r => 
                    r.item instanceof paper.Path || r.item instanceof paper.CompoundPath
                );
                
                if (hitResult) {
                    const targetPath = hitResult.item;
                    console.log('path matrix:', targetPath.matrix.toString());
                    console.log('parent matrix:', targetPath.parent.matrix.toString());
                    console.log('grandparent matrix:', targetPath.parent?.parent?.matrix.toString());
                    const pathId = targetPath.name;
                    onPathSelectRef.current?.(pathId, event.event);
                } else {
                    // Clicked empty area - clear selection
                    onPathSelectRef.current?.(null, event.event);
                }
            }
            else if (toolModeRef.current === 'Split'){
                const hitOptions = {
                    segments: true,
                    stroke: true,
                    tolerance: 5
                }

                const hitResults = scope.project.hitTestAll(event.point, hitOptions);
                const hitResult = hitResults.find(r => 
                    r.item instanceof paper.Path || r.item instanceof paper.CompoundPath
                );
                const originalPath = hitResult.item;
                const splitPoint = originalPath.getNearestPoint(hitResult.point);
                const scalarOffset = originalPath.getOffsetOf(splitPoint);
                const newPath = originalPath.splitAt(scalarOffset);
                if (newPath) {
                    newPath.position.x += Math.random() * (20 - 10) + 10;
                    newPath.position.y += Math.random() * (20 - 10) + 10;
                    newPath.name = `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
                    onPathSplit(originalPath.name, newPath.name);
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

        scope.view.onMouseMove = (event) => {
            if (toolModeRef.current === 'Split') {
                const hitOptions = {
                    segments: true,
                    stroke: true,
                    tolerance: 5
                }

                const hitResults = scope.project.hitTestAll(event.point, hitOptions);
                const hitResult = hitResults.find(r => 
                    r.item instanceof paper.Path || r.item instanceof paper.CompoundPath
                )

                if (hitResult) {
                    onPathHoverRef.current?.(hitResult.point);
                } else {
                    onPathHoverRef.current?.(null);
                }
            }

            else if (toolModeRef.current === 'Select') {
                if (hoverTimeout) clearTimeout(hoverTimeout);

                hoverTimeout = setTimeout(() => {                    
                    const hitOptions = {
                        stroke: true,
                        fill: true,
                        tolerance: 5
                    }

                    const hitResults = scope.project.hitTestAll(event.point, hitOptions);
                    const hitResult = hitResults.find(r => 
                        r.item instanceof paper.Path || r.item instanceof paper.CompoundPath
                    );
                    
                    const newPath = hitResult?.item ?? null;
                    canvasRef.current.style.cursor = newPath ? 'pointer' : 'default';

                    if (newPath !== hoveredPath) {
                        if (hoveredPath) {
                            if (selectedPathIdsRef.current.has(hoveredPath.name)) {
                                // Re-apply selection style so it isn't lost when un-hovering
                                hoveredPath.strokeColor = new paper.Color(0.2, 0.6, 1);
                            } else {
                                hoveredPath.strokeColor = hoveredPath.data.originalStroke?.clone() ?? null;
                            }
                        }
                        hoveredPath = newPath;
                        if (newPath) {
                            // Initialise true originals in case SVG loaded before this code ran
                            if (!newPath.data.originalStyleSaved) {
                                newPath.data.originalStroke = newPath.strokeColor?.clone() ?? null;
                                newPath.data.originalStyleSaved = true;
                            }
                            newPath.strokeColor = new paper.Color(0.2, 0.6, 1);
                        }
                    }
                }, 16);
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
            console.log(svgContent);
            scopeRef.current.project.clear();
            const imported = scopeRef.current.project.importSVG(svgContent);
            if (imported) {
                scopeRef.current.view.center = imported.bounds.center;
                imported.fitBounds(scopeRef.current.view.bounds.scale(0.7));
                function applyMatrixDeep(item) {
                    if (item.children) item.children.forEach(applyMatrixDeep);
                    item.applyMatrix = true;
                }
                applyMatrixDeep(imported);
            }
            const backgroundShape = imported.children[0];
            const drawingGroup = imported.children[1];

            drawingGroup.children?.forEach(item => {
                // Name and save true originals before any hover/selection styling can corrupt them
                if (!item.name) item.name = `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
                item.data.originalStroke = item.strokeColor?.clone() ?? null;
                item.data.originalStrokeWidth = item.strokeWidth ?? 0;
                item.data.originalStyleSaved = true;
            });

            backgroundShape.remove();

            onSVGLoaded(
                scopeRef.current.project.exportSVG({asString: true, bounds: 'content'}), 
                scopeRef.current.view.center.subtract(imported.bounds.center)
            )
        }
    }, [svgContent]);

    // Visual feedback for selected paths
    useEffect(() => {
        if (!scopeRef.current) return;

        const paths = scopeRef.current.project.getItems({
            match: (item) => item instanceof paper.Path || item instanceof paper.CompoundPath
        });
        paths.forEach(path => {
            const pathId = path.name;
            if (selectedPathIds.has(pathId)) {
                // Lazily save true originals (guarded by flag, not falsy originalStroke)
                if (!path.data.originalStyleSaved) {
                    path.data.originalStroke = path.strokeColor?.clone() ?? null;
                    path.data.originalStrokeWidth = path.strokeWidth ?? 0;
                    path.data.originalStyleSaved = true;
                }
                // Apply selection style
                path.strokeColor = new paper.Color(0.2, 0.6, 1);
                path.strokeWidth = path.data.originalStrokeWidth + 2;
            } else {
                // Restore true original styles
                if (path.data.originalStyleSaved) {
                    path.strokeWidth = path.data.originalStrokeWidth;
                    path.strokeColor = path.data.originalStroke?.clone() ?? null;
                }
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