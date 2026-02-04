import { useState } from 'react';
import { DrawingViewer } from './DrawingViewer';
import { BackIcon } from '../../icons';

export function DrawingCard({drawing}) {
    const [expanded, setExpanded] = useState(false);

    if (expanded) {
        return (
            <div>
                <button
                    className="btn btn-ghost btn-sm mb-2"
                    onClick={() => setExpanded(false)}
                >
                    <BackIcon />
                </button>
                <DrawingViewer drawingId={drawing._id} />
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body p-4">
                <h3 className="card-title text-base">{drawing.name}</h3>
                <div className="flex gap-2 text-sm opacity-70">
                    {drawing.processedStyle && (
                        <span className="badge badge-outline badge-sm">
                            {drawing.processedStyle}
                        </span>
                    )}
                    <span className="badge badge-sm">
                        {drawing.status}
                    </span>
                </div>
                <p className="text-xs opacity-50">
                    {new Date(drawing.createdAt).toLocaleDateString()}
                </p>
                <div className="card-actions justify-end mt-2">
                    {drawing.status === 'complete' && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setExpanded(true)}
                        >
                            View
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}