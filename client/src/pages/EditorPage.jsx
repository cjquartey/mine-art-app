import { useState, useEffect } from 'react';
import { PaperCanvas } from "../components/Editor/PaperCanvas";
import { TopToolbar } from "../components/Editor/TopToolbar";
import { LeftSidebar } from "../components/Editor/LeftSidebar";
import { useParams } from 'react-router-dom';
import { useDrawing } from '../hooks/useDrawing';
import { useSelection } from '../components/Editor/hooks/useSelection';

export function EditorPage() {
    const {drawingId} = useParams();
    const {svgContent} = useDrawing(drawingId);
    const [zoom, setZoom] = useState(1);
    const [toolMode, setToolMode] = useState('select');
    const {selectedPathIds, selectPath, clearSelection} = useSelection();

    useEffect(() => {
        console.log(selectedPathIds);
    }, [selectedPathIds]);

    function handlePathSelect(pathId, nativeEvent) {
        if (pathId === null) clearSelection();
        else selectPath(pathId, nativeEvent.shiftKey) // Shift for mulitple path selection
    }

    return (
        <div className="h-[calc(100vh-64px)] w-full overflow-hidden">
            <div className="drawer lg:drawer-open h-full">
                <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col h-full overflow-hidden">
                    <TopToolbar zoom={zoom} onZoomChange={setZoom} />
                    <div className="flex-1 overflow-hidden">
                        <PaperCanvas
                            svgContent={svgContent}
                            zoom={zoom}
                            onZoomChange={setZoom}
                            toolMode={toolMode}
                            selectedPathIds={selectedPathIds} 
                            onPathSelect={handlePathSelect}
                        />
                    </div>
                </div>
                <LeftSidebar />
            </div>
        </div>
    )
}