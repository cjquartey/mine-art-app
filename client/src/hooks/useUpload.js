import {useState, useRef, useEffect} from "react";
import api from "../utils/api";
import { useSessionContext } from "./useSessionContext";

export function useUpload() {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [drawingId, setDrawingId] = useState(null);
    const {sessionId} = useSessionContext();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        }
    }, []);

    async function pollStatus(drawingId) {
        try{
            while (true) {
                const headers = {};
                if (sessionId) headers['x-session-id'] = sessionId;

                const response = await api.get(`drawings/${drawingId}/status`, {
                    headers
                });

                const drawingStatus = response.data.status;

                if (!isMounted.current) break;

                if (drawingStatus === 'queued'){
                    setStatus('queued');
                    setUploadProgress(50);
                } else if (drawingStatus === 'processing') {
                    setStatus('processing');
                    setUploadProgress(75);
                } else if (drawingStatus === 'complete') {
                    setStatus('success');
                    setUploadProgress(100);
                    break;
                } else if (drawingStatus === 'failed') {
                    setStatus('error');
                    setError(response.data.errorMessage);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch(error) {
            if (isMounted.current) {
                setStatus('error');
                setError(`Failed to get drawing status. Error: ${error}`);
            }
        }
    }
    async function uploadImage(formData) {
        setStatus('uploading');
        setError(null);
        setUploadProgress(0);

        try{
            const headers = {};
            if (sessionId) headers['x-session-id'] = sessionId;

            const response = await api.post('/upload', formData, {
                headers,
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 50) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });
            
            setDrawingId(response.data.drawingId);
            await pollStatus(response.data.drawingId);
        } catch(error) {
            setStatus('error');
            setError(error.response?.data?.message || 'Upload failed');
        }
    }

    function reset() {
        setStatus('idle');
        setError(null);
        setDrawingId(null);
        setUploadProgress(0);
    }
    
    return {
        uploadProgress,
        status,
        error,
        drawingId,
        uploadImage,
        reset
    };
}