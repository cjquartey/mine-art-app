import { useDrawing } from '../../hooks/useDrawing';
import { ErrorMessage } from '../ErrorMessage';
import {LoadingSpinner} from '../LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export function DrawingViewer({drawingId}) {
    const navigate = useNavigate();

    const {
        svgContent, 
        metadata, 
        loading, 
        error
    } = useDrawing(drawingId);

    if (loading) {
        return <LoadingSpinner message={"Loading Drawing"} />
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!svgContent) {
        return <ErrorMessage message={"No drawing content available"} />;
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            {metadata && (
                <div className="card-body pb-2">
                    <h2 className="card-title">{metadata.name}</h2>
                    <div className="flex gap-2 text-sm opacity-70">
                        <span className="badge badge-outline">{metadata.processedStyle}</span>
                        <span>{new Date(metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
            <figure className="px-4 pb-4">
                <div
                    className="w-full bg-white rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            </figure>
            <div className="card-actions justify-end p-4 pt-0">
                <button 
                    className="btn btn-accent btn-md"
                    onClick={() => navigate(`/editor/${drawingId}`)}
                >
                    Edit drawing
                </button>
                <button
                    className="btn btn-primary btn-md"
                >
                    Download drawing
                </button>
            </div>
        </div>
    );
}