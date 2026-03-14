import { useState, useRef, useEffect } from 'react';
import { PaperCanvas } from "../components/Editor/PaperCanvas";
import { TopToolbar } from "../components/Editor/TopToolbar";
import { LeftSidebar } from "../components/Editor/LeftSidebar";
import { useParams } from 'react-router-dom';
import { useDrawing } from '../hooks/useDrawing';
import { useSelection } from '../components/Editor/hooks/useSelection';
import { useCollaborativeEditor } from '../components/Editor/hooks/useCollaborativeEditor';
import { useAuthContext } from '../hooks/useAuthContext';
import { SelectionOverlay } from '../components/Editor/SelectionOverlay';
import { useTransform } from '../components/Editor/hooks/useTransform';
import { useHistory } from '../components/Editor/hooks/useHistory';
import { ScissorsPreview } from '../components/Editor/ScissorsPreview';
import { projectToView } from '../components/Editor/utils/coordinateConversion';
import { LockedPathsOverlay } from '../components/Editor/LockedPathsOverlay';
import { ErrorMessage } from '../components/ErrorMessage';

export function EditorPage() {
    const {drawingId} = useParams();
    const {svgContent} = useDrawing(drawingId);
    const {startTransform, updateTransform, applyTransform, cancelTransform} = useTransform();
    const [zoom, setZoom] = useState(1);
    const [toolMode, setToolMode] = useState('Select');
    const [boundsMode, setBoundsMode] = useState('combined');
    const [panTrigger, setPanTrigger] = useState(null);
    const [transformationTrigger, setTransformationTrigger] = useState(null);
    const paperCanvasRef = useRef(null);
    const activeTransformPathIdRef = useRef(null);
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [strokeColour, setStrokeColour] = useState('#000000');
    const [point, setPoint] = useState(null);
    const {user} = useAuthContext();
    const {canRedo, canUndo, pushSnapshot, redo, undo} = useHistory();
    const {
        selectedPathIds, 
        getSelectionBounds, 
        selectPath, 
        selectAll, 
        clearSelection
    } = useSelection();
    const {
        members,
        locks,
        error,
        collabTrigger,
        requestLock,
        releaseLock,
        emitPathUpdate
    } = useCollaborativeEditor(drawingId, paperCanvasRef);

    function handleToolSelect(toolName) {
        setToolMode(toolName);
    }

    function handleToolClick(toolName) {
        if (toolName === 'Redo') {
            const snapshot = redo();
            if (snapshot) paperCanvasRef.current?.loadSVG(snapshot);
            clearSelection();
        }
        else if (toolName === 'Undo') {
            const snapshot = undo();
            if (snapshot) paperCanvasRef.current?.loadSVG(snapshot);
            clearSelection();
        }
        else if (toolName === 'Duplicate') {
            if (selectedPathIds.size > 0) {
                const duplicatedPathIds = paperCanvasRef.current?.duplicatePaths(selectedPathIds);
                const svg = paperCanvasRef.current?.getCurrentSVG();
                if (svg) pushSnapshot(svg.svgString, svg.panOffset);
                clearSelection();
                duplicatedPathIds.forEach(pathId => selectPath(pathId, true));
            }
        }
        else if (toolName === 'Delete') {
            if (selectedPathIds.size > 0) {
                paperCanvasRef.current?.deletePaths(selectedPathIds);
                const svg = paperCanvasRef.current?.getCurrentSVG();
                if (svg) pushSnapshot(svg.svgString, svg.panOffset);
                clearSelection();
            }
        }
        else if (toolName === 'Select All') {
            paperCanvasRef.current?.selectAllPaths();
        }
        else if (toolName === 'Find All Paths') {
            const pathIds = paperCanvasRef.current?.getAllPathIds();
            setBoundsMode('individual');
            if (pathIds) selectAll(pathIds);
        }
    }

    function handlePathSelect(pathId, nativeEvent) {
        setBoundsMode('combined');
        if (pathId === null) {
            selectedPathIds.forEach(pathId => releaseLock(pathId))
            clearSelection();
        }
        else{
            if (nativeEvent.shiftKey && selectedPathIds.has(pathId)) {
                releaseLock(pathId); // Deselect an existing path
            } else {
                requestLock(pathId) // Select a new path
            }
            selectPath(pathId, nativeEvent.shiftKey) // Shift for mulitple path selection
        }
    }

    function handlePathHover(projectPoint) {
        if (projectPoint) {
            const scope = paperCanvasRef.current?.getScope().current;
            const viewPoint = projectToView(projectPoint, scope);
            setPoint(viewPoint);
        } else {
            setPoint(null);
        }
    }

    function handlePathSplit(originalPathID, newPathID) {
        setBoundsMode('individual');
        selectPath(originalPathID, true);
        selectPath(newPathID, true);
        const svg = paperCanvasRef.current?.getCurrentSVG();
        if (svg) pushSnapshot(svg.svgString, svg.panOffset);
    }

    function handleDrawEnd() {
        const svg = paperCanvasRef.current?.getCurrentSVG();
        if (svg) pushSnapshot(svg.svgString, svg.panOffset);
    }

    function onTransformStart(handleType, corner, position, originalBounds, pathId = null) {
        activeTransformPathIdRef.current = pathId;
        startTransform(handleType, {corner, position, originalBounds});
    }

    function onTransform(position) {
        updateTransform(paperCanvasRef, position);
        const pathIds = activeTransformPathIdRef.current
            ? new Set([activeTransformPathIdRef.current])
            : selectedPathIds;
        const transformData = applyTransform(paperCanvasRef, pathIds);
        pathIds.forEach(pathId => emitPathUpdate(pathId, transformData));
        setTransformationTrigger({active: true});
    }

    function onTransformEnd() {
        activeTransformPathIdRef.current = null;
        cancelTransform();
        selectedPathIds.forEach(pathId => releaseLock(pathId));
        const svg = paperCanvasRef.current?.getCurrentSVG();
        if (svg) pushSnapshot(svg.svgString, svg.panOffset);
        clearSelection();
    }

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.ctrlKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    const snapshot = undo();
                    if (snapshot) paperCanvasRef.current?.loadSVG(snapshot);
                    clearSelection();
                } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    const snapshot = redo();
                    if (snapshot) paperCanvasRef.current?.loadSVG(snapshot);
                    clearSelection();
                } else if (e.key === 'd') {
                    e.preventDefault();
                    const duplicatedPathIds = paperCanvasRef.current?.duplicatePaths(selectedPathIds);
                    const svg = paperCanvasRef.current?.getCurrentSVG();
                    if (svg) pushSnapshot(svg.svgString, svg.panOffset);
                    clearSelection();
                    duplicatedPathIds.forEach(pathId => selectPath(pathId, true));
                } 
            }
            
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                paperCanvasRef.current?.deletePaths(selectedPathIds);
                const svg = paperCanvasRef.current?.getCurrentSVG();
                if (svg) pushSnapshot(svg.svgString, svg.panOffset);
                clearSelection();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectedPathIds]);

    return (
        <div className="h-[calc(100vh-64px)] w-full overflow-hidden">
            <div className="drawer lg:drawer-open h-full">
                <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col h-full overflow-hidden">
                    <TopToolbar
                        zoom={zoom}
                        onZoomChange={setZoom}
                        activeTool={toolMode}
                        onToolSelect={handleToolSelect}
                        onToolClick={handleToolClick}
                        canRedo={canRedo}
                        canUndo={canUndo}
                        drawWidth={strokeWidth}
                        onDrawWidthChange={setStrokeWidth}
                        strokeColour={strokeColour}
                        onColourChange={color => setStrokeColour(color.hex)}
                    />
                    <div className="relative flex-1 overflow-hidden">
                        {error && <ErrorMessage message={error}/>}
                        <PaperCanvas
                            svgContent={svgContent}
                            zoom={zoom}
                            onZoomChange={setZoom}
                            toolMode={toolMode}
                            selectedPathIds={selectedPathIds}
                            drawWidth={strokeWidth}
                            drawColour={strokeColour}
                            onDrawEnd={handleDrawEnd}
                            onPathSelect={handlePathSelect}
                            onSelectAll={selectAll}
                            onPathHover={handlePathHover}
                            onPathSplit={handlePathSplit}
                            onPan={setPanTrigger}
                            onSVGLoaded={pushSnapshot}
                            ref={paperCanvasRef}
                        />

                        {selectedPathIds.size > 0 && <SelectionOverlay
                            paperCanvasRef={paperCanvasRef}
                            selectedPathIds={selectedPathIds}
                            getSelectionBounds={getSelectionBounds}
                            boundsMode={boundsMode}
                            zoom={zoom}
                            onTransformStart={onTransformStart}
                            onTransformEnd={onTransformEnd}
                            onTransform={onTransform}
                            panTrigger={panTrigger}
                            transformationTrigger={transformationTrigger}
                        />}

                        {point && <ScissorsPreview
                            point={point}
                        />}

                        {locks.length > 0 && locks.map(lock => {
                            if (lock.userId === user.userId) return null;
                            return (
                                <LockedPathsOverlay
                                    key={lock.pathId}
                                    lock={lock}
                                    collabTrigger={collabTrigger}
                                    paperCanvasRef={paperCanvasRef}
                                    zoom={zoom}
                                    panTrigger={panTrigger}
                                />
                            )
                        })}
                    </div>
                </div>
                <LeftSidebar
                    collaborators={members}
                />
            </div>
        </div>
    )
}