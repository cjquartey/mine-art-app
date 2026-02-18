import { useState, useRef } from 'react';
import { PaperCanvas } from "../components/Editor/PaperCanvas";
import { TopToolbar } from "../components/Editor/TopToolbar";
import { LeftSidebar } from "../components/Editor/LeftSidebar";
import { useParams } from 'react-router-dom';
import { useDrawing } from '../hooks/useDrawing';
import { useSelection } from '../components/Editor/hooks/useSelection';
import { SelectionOverlay } from '../components/Editor/SelectionOverlay';
import { useTransform } from '../components/Editor/hooks/useTransform';

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

    function handleToolSelect(toolType) {
        setToolMode(toolType);
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
    }

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