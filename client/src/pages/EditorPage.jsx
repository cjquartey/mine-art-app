import { useState } from 'react';
import { PaperCanvas } from "../components/Editor/PaperCanvas";
import { TopToolbar } from "../components/Editor/TopToolbar";
import { LeftSidebar } from "../components/Editor/LeftSidebar";
import { useParams } from 'react-router-dom';
import { useDrawing } from '../hooks/useDrawing';

export function EditorPage() {
    const {drawingId} = useParams();
    const {svgContent} = useDrawing(drawingId);
    const [zoom, setZoom] = useState(1);

    return (
        <div className="h-[calc(100vh-64px)] w-full overflow-hidden">
            <div className="drawer lg:drawer-open h-full">
                <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col h-full overflow-hidden">
                    <TopToolbar zoom={zoom} onZoomChange={setZoom} />
                    <div className="flex-1 overflow-hidden">
                        <PaperCanvas svgContent={svgContent} zoom={zoom} onZoomChange={setZoom} />
                    </div>
                </div>
                <LeftSidebar />
            </div>
        </div>
    )
}