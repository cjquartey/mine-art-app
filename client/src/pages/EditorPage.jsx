import { useState, useRef, useEffect } from 'react';
import { PaperCanvas } from "../components/Editor/PaperCanvas";
import { TopToolbar } from "../components/Editor/TopToolbar";
import { LeftSidebar } from "../components/Editor/LeftSidebar";
import { useParams } from 'react-router-dom';
import { useDrawing } from '../hooks/useDrawing';
import { useSelection } from '../components/Editor/hooks/useSelection';
import { SelectionOverlay } from '../components/Editor/SelectionOverlay';
import { useTransform } from '../components/Editor/hooks/useTransform';
import { useHistory } from '../components/Editor/hooks/useHistory';

export function EditorPage() {
    const {drawingId} = useParams();
    const {svgContent} = useDrawing(drawingId);
    const {startTransform, updateTransform, applyTransform, cancelTransform} = useTransform();
    const [zoom, setZoom] = useState(1);
    const [toolMode, setToolMode] = useState('Select');
    const [panTrigger, setPanTrigger] = useState(null);
    const [transformationTrigger, setTransformationTrigger] = useState(null);
    const {selectedPathIds, getSelectionBounds, selectPath, clearSelection} = useSelection();
    const paperCanvasRef = useRef(null);
    const {canRedo, canUndo, pushSnapshot, redo, undo} = useHistory();

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
                duplicatedPathIds.forEach(pathId => selectPath(pathId));
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
    }

    function handlePathSelect(pathId, nativeEvent) {
        if (pathId === null) clearSelection();
        else selectPath(pathId, nativeEvent.shiftKey) // Shift for mulitple path selection
    }

    function onTransformStart(handleType, corner, position, originalBounds) {
        startTransform(handleType, {corner, position, originalBounds});
    }

    function onTransform(position) {
        updateTransform(paperCanvasRef, position);
        applyTransform(paperCanvasRef, selectedPathIds);
        setTransformationTrigger({active: true});
    }

    function onTransformEnd() {
        cancelTransform();
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
                    duplicatedPathIds.forEach(pathId => selectPath(pathId));
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
                    />
                    <div className="relative flex-1 overflow-hidden">
                        <PaperCanvas
                            svgContent={svgContent}
                            zoom={zoom}
                            onZoomChange={setZoom}
                            toolMode={toolMode}
                            selectedPathIds={selectedPathIds} 
                            onPathSelect={handlePathSelect}
                            onPan={setPanTrigger}
                            onSVGLoaded={pushSnapshot}
                            ref={paperCanvasRef}
                        />

                        {selectedPathIds.size > 0 && <SelectionOverlay
                            paperCanvasRef={paperCanvasRef}
                            selectedPathIds={selectedPathIds}
                            getSelectionBounds={getSelectionBounds}
                            zoom={zoom}
                            onTransformStart={onTransformStart}
                            onTransformEnd={onTransformEnd}
                            onTransform={onTransform}
                            panTrigger={panTrigger}
                            transformationTrigger={transformationTrigger}
                        />}
                    </div>
                </div>
                <LeftSidebar />
            </div>
        </div>
    )
}