import { useState, useEffect } from 'react';
import api from '../utils/api';
import {useSessionContext} from './useSessionContext';

export function useDrawing(drawingId) {
    const [svgContent, setSvgContent] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {sessionId} = useSessionContext();

    useEffect(() => {
        if (!drawingId) {
            setLoading(false);
            return;
        }

        async function fetchDrawing() {
            setLoading(true);
            setError(null);

            const headers = {};
            if (sessionId) headers['x-session-id'] = sessionId;

            try {
                // Fetch metadata and SVG simultaneously
                const [metadataRes, svgRes] = await Promise.all([
                    api.get(`/drawings/${drawingId}`, { headers }),
                    api.get(`/drawings/${drawingId}/svg`, {
                        headers,
                        responseType: 'text'
                    })
                ]);

                setMetadata(metadataRes.data.drawingMetadata);
                setSvgContent(svgRes.data);
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to load drawing');
            } finally {
                setLoading(false);
            }
        }

        fetchDrawing();
    }, [drawingId, sessionId]);

    return {
        svgContent, 
        metadata, 
        loading, 
        error
    };
}
