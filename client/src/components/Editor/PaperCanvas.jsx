import {useImperativeHandle, useRef, useEffect} from 'react';
import paper from 'paper';

export function PaperCanvas({
    svgContent,
    zoom,
    onZoomChange,
    toolMode='Select',
    selectedPathIds,
    drawWidth,
    drawColour,
    onPathSelect,
    onSelectAll,
    onPathHover,
    onPathSplit, 
    onPan,
    onSVGLoaded,
    onDrawEnd,
    ref
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const scopeRef = useRef(null);
    const toolModeRef = useRef(toolMode);
    const firstClickRef = useRef(null);
    const onPathSelectRef = useRef(onPathSelect);
    const onPathHoverRef = useRef(onPathHover);
    const onPathSplitRef = useRef(onPathSplit);
    const onPanRef = useRef(onPan);
    const onDrawEndRef = useRef(onDrawEnd);
    const drawWidthRef = useRef(drawWidth);
    const drawColourRef = useRef(drawColour);

    useImperativeHandle(ref, () => ({
        getScope: () => scopeRef,
        getContainer: () => containerRef,
        getCurrentSVG: () => { 
            const paths = scopeRef.current.project.getItems({
                match: item => item instanceof paper.Path || item instanceof paper.CompoundPath
            });

            const savedStyles = [];
            paths.forEach(path => {
                if (path.data.originalStyleSaved) {
                    savedStyles.push({
                        path, 
                        strokeColor: path.strokeColor?.clone() ?? null, 
                        strokeWidth: path.strokeWidth
                    });
                    path.strokeColor = path.data.originalStroke?.clone() ?? null;
                    path.strokeWidth = path.data.originalStrokeWidth ?? 0;
                }
            });

            const result = {
                svgString: scopeRef.current.project.exportSVG({asString: true, bounds: 'content'}),
                panOffset: scopeRef.current.project.bounds
                    ? scopeRef.current.view.center.subtract(scopeRef.current.project.bounds.center)
                    : new paper.Point(0, 0)
            };

            savedStyles.forEach(({path, strokeColor, strokeWidth}) => {
                path.strokeColor = strokeColor;
                path.strokeWidth = strokeWidth;
            });

            return result;
        },
        loadSVG: ({svgString, panOffset}) => {
            scopeRef.current.project.clear();
            const imported = scopeRef.current.project.importSVG(svgString);
            imported.children[0].remove();
            scopeRef.current.project.getItems({
                match: item => item instanceof paper.Path || item instanceof paper.CompoundPath
            }).forEach(path => path.data.originalStyleSaved = false);
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
                    duplicatedPath.position.x += 25;
                    duplicatedPath.position.y += 10;
                    duplicatedPathIds.push(duplicatedPath.name);
                }
            });
            return duplicatedPathIds;
        },
        selectAllPaths: () => {
            const paths = scopeRef.current.project.getItems({
                match: (item) => (item instanceof paper.Path || item instanceof paper.CompoundPath)
                    && !(item.parent instanceof paper.CompoundPath)
            });
            const pathIds = paths.map(path => path.name);
            onSelectAll(pathIds);
        },
        getAllPathIds: () => {
            const paths = scopeRef.current.project.getItems({
                match: (item) => (item instanceof paper.Path || item instanceof paper.CompoundPath)
                    && !(item.parent instanceof paper.CompoundPath)
            });
            const pathIds = paths.map(path => path.name);
            return pathIds;
        },
        updatePath: (pathId, transformData) => {
            if (transformData.type === 'move') {
                const path = scopeRef.current.project.getItem({name: pathId});
                if (path) path.translate(transformData.delta);
            } 
                    
            else if (transformData.type === 'rotate') {
                const path = scopeRef.current.project.getItem({name: pathId});
                if (path) path.rotate(transformData.rotationDelta, transformData.centerCanvas);
            }

            else if (transformData.type === 'scale') {
                const path = scopeRef.current.project.getItem({name: pathId});
                if (path) path.scale(transformData.incrementalScale, transformData.pivotCanvas)
            }
        }
    }));

    const selectedPathIdsRef = useRef(selectedPathIds);

    useEffect(() => {
        toolModeRef.current = toolMode;
        onPathSelectRef.current = onPathSelect;
        onPathHoverRef.current = onPathHover;
        onPathSplitRef.current = onPathSplit;
        onPanRef.current = onPan;
        onDrawEndRef.current = onDrawEnd;
        selectedPathIdsRef.current = selectedPathIds;
        drawWidthRef.current = drawWidth;
        drawColourRef.current = drawColour;
    }, [toolMode, onPathSelect, onPathHover, onPathSplit, onPan, onDrawEnd, selectedPathIds, drawWidth, drawColour]);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const scope = new paper.PaperScope();
        scope.setup(canvas);
        scopeRef.current = scope;

        let drawingPath = null;
        let hoveredPath = null;
        let hoverTimeout = null;

        // Handle click events based on the chosen tool
        scopeRef.current.view.onMouseDown = (event) => {
            if (toolModeRef.current === 'Select') {
                const hitOptions = {
                    stroke: true,
                    fill: true,
                    tolerance: 5
                }

                const hitResults = scopeRef.current.project.hitTestAll(event.point, hitOptions);
                const hitResult = hitResults.find(r => 
                    r.item instanceof paper.Path || r.item instanceof paper.CompoundPath
                );
                
                if (hitResult) {
                    console.log(hitResult)
                    const targetPath = hitResult.item;
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

                const hitResults = scopeRef.current.project.hitTestAll(event.point, hitOptions);
                const hitResult = hitResults.find(r => 
                    r.item instanceof paper.Path || r.item instanceof paper.CompoundPath
                );

                if (!hitResult) return;
                console.log(hitResult);
                let item = hitResult.item;

                if (firstClickRef.current === null) {
                    firstClickRef.current = {
                        itemName: item.name,
                        location: item.getNearestLocation(event.point),
                        offset: item.getOffsetOf(item.getNearestPoint(event.point)),
                        splitMarker: new paper.Path.Circle({
                            center: event.point,
                            radius: 4,
                            strokeWidth: 4,
                            strokeColor: 'red'
                        })
                    }  
                }
                else {
                    if (item.name && item.name !== firstClickRef.current.itemName) {
                        console.log('Names do not match!');
                        firstClickRef.current.splitMarker.remove();
                        firstClickRef.current = null;
                        return;
                    }
                    else if (!item.name || !firstClickRef.current.itemName) {
                        console.log('Empty name')
                        return;
                    }
                    
                    else {
                        const loc1 = firstClickRef.current.location;
                        console.log(loc1);
                        item.divideAt(loc1);

                        const loc2 = item.getNearestLocation(event.point);
                        console.log(loc2);
                        item.divideAt(loc2);

                        const segs = item.segments;
                        const n = segs.length;
                        const idx1 = segs.reduce((best, s, i) =>
                            s.point.getDistance(firstClickRef.current.location) < segs[best].point.getDistance(firstClickRef.current.location) ? i : best, 0);
                        const idx2 = segs.reduce((best, s, i) =>
                            s.point.getDistance(event.point) < segs[best].point.getDistance(event.point) ? i : best, 0);

                        function arcSegments(from, to) {
                            const result = [];
                            for (let i = from; i !== to; i = (i + 1) % n) result.push(segs[i].clone());
                            result.push(segs[to].clone());
                            return result;
                        }

                        const p1 = new paper.Path({
                            segments: arcSegments(idx1, idx2), 
                            closed: true, 
                            fillColor: null,
                            name: `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`
                        });
                        const p2 = new paper.Path({
                            segments: arcSegments(idx2, idx1), 
                            closed: true, 
                            fillColor: null,
                            name: `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`
                        });

                        firstClickRef.current.splitMarker.remove();
                        firstClickRef.current = null;

                        item.remove();

                        onPathSplitRef.current(p1.name, p2.name);
                    }
                }

                /* Another approach
                
                if (item.parent && item.parent.className === 'CompoundPath') {
                    const compound = item.parent;

                    const children = [...compound.children];
                    children.forEach(child => {
                        child.transform(compound.matrix);
                        child.name = `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
                        scopeRef.current.project.activeLayer.addChild(child);
                    });

                    compound.remove();

                    item = scopeRef.current.project.activeLayer.children.find(
                        child => child.name === hitResult.item.name
                    );

                    if (!item) return;
                }

                if (item.parent && item.parent.className === 'Group') {
                    // Accumulate the full world transform walking up through nested groups
                    let matrix = new scope.Matrix();
                    let ancestor = item.parent;
                    while (ancestor && ancestor.className === 'Group') {
                        matrix = ancestor.matrix.prepended(matrix);
                        ancestor = ancestor.parent;
                    }
                    // Bake world transform into the path's segments
                    item.transform(matrix);
                    // Re-parent to active layer
                    scopeRef.current.project.activeLayer.addChild(item);
                }

                const splitPoint = item.getNearestPoint(event.point);
                const scalarOffset = item.getOffsetOf(splitPoint);
                const newPath = item.splitAt(scalarOffset);
                console.log('newPath:', newPath, 'offset:', scalarOffset, 'path length:', item.length);
                if (newPath) {
                    newPath.position.x += Math.random() * (20 - 10) + 10;
                    newPath.position.y += Math.random() * (20 - 10) + 10;
                    newPath.name = `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
                    onPathSplit(item.name, newPath.name);
                } */
            }
            else if (toolModeRef.current === 'Draw'){
                drawingPath = new paper.Path({
                    name: `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`,
                    strokeCap: 'round',
                    strokeWidth: drawWidthRef.current,
                    strokeColor: drawColourRef.current
                });
            }
        }
        // Pan canvas on mouse drag
        scopeRef.current.view.onMouseDrag = (event) => {
            if (toolModeRef.current === 'Pan') {
                scopeRef.current.view.center = scopeRef.current.view.center.subtract(event.delta);
                onPanRef.current?.(scopeRef.current.view.center);
            }
            if (toolModeRef.current === 'Draw') {
                drawingPath.add(event.point);
            }
        }

        scopeRef.current.view.onMouseUp = () => {
            if (toolModeRef.current === 'Draw') {
                if (drawingPath.segments.length > 0) {
                    drawingPath.simplify();
                    drawingPath.data.originalStroke = drawingPath.strokeColor?.clone() ?? null;
                    drawingPath.data.originalStrokeWidth = drawingPath.strokeWidth ?? 0;
                    drawingPath.data.originalStyleSaved = true;
                    onDrawEndRef.current();
                }
                else {
                    drawingPath.remove();
                }
                drawingPath = null;
            }
        }

        scopeRef.current.view.onMouseMove = (event) => {
            if (toolModeRef.current === 'Split') {
                const hitOptions = {
                    segments: true,
                    stroke: true,
                    tolerance: 5
                }

                const hitResults = scopeRef.current.project.hitTestAll(event.point, hitOptions);
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

                    const hitResults = scopeRef.current.project.hitTestAll(event.point, hitOptions);
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
                scopeRef.current.view.viewSize = new paper.Size(width, height);
            }
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            scopeRef.current.project.clear();
            scopeRef.current.remove();
        }
    }, []);

    // Load drawing
    useEffect(() => {
        if (svgContent && scopeRef.current) {
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

            console.log('drawingGroup children:', drawingGroup.children?.map(item => ({
                type: item.className,
                name: item.name,
                hasFill: !!item.fillColor,
                hasStroke: !!item.strokeColor,
                childCount: item.children?.length ?? 0,
                bounds: item.bounds.toString()
            })));

            drawingGroup.children?.forEach(item => {
                // Name and save true originals before any hover/selection styling can corrupt them
                if (!item.name) item.name = `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
                if (item instanceof paper.CompoundPath) {
                    item.children?.forEach(child => {
                        if (!child.name) child.name = `path_${Date.now()}_${Math.round(Math.random() * 1E9)}`
                    })
                }
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
                // Save true originals
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