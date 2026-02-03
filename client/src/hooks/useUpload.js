import {useState} from "react";
import api from "../utils/api";
import { useSessionContext } from "./useSessionContext";

export function useUpload() {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [drawingId, setDrawingId] = useState(null);
    const {sessionId} = useSessionContext();

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

            setStatus('processing');
            setUploadProgress(75);

            setStatus('success');
            setDrawingId(response.data.drawing.id);
            setUploadProgress(100);
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