import {useState, useEffect} from 'react';
import { FileDropzone } from './FileDropzone';
import { SuccessMessage } from '../SuccessMessage';
import { ErrorMessage } from '../ErrorMessage';
import { UploadProgress } from './UploadProgress';
import { StyleSelector } from './StyleSelector';
import { ProjectSelector } from '../Projects/ProjectSelector';
import { useUpload } from '../../hooks/useUpload';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useProjectsContext } from '../../hooks/useProjectsContext';
import { Dock } from '../../pages/dashboard/Dock';

export function ImageUploader() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [drawingName, setDrawingName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    const {
        uploadProgress,
        status,
        error,
        drawingId,
        uploadImage
    } = useUpload();

    const {user} = useAuthContext();

    const {fetchProjects} = useProjectsContext();

    // Fetch projects on mount if user is logged in
    useEffect(() => {
        if(user) {
            fetchProjects();
        }
    }, [user]);

    // Clear validation errors after upload success
    useEffect(() => {
        function resetForm() {
            setValidationErrors([]);
            setSelectedFile(null);
            setDrawingName('');
            setSelectedStyle('');
        }
        
        if(status === 'success') {
            resetForm();
        }
    }, [status]);

    function handleFileSelect(file) {
        if(file === null){
            setSelectedFile(null);
            setValidationErrors([]);
            return;
        }

        const maxSize = 20 * 1024 * 1024; // 20 MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!allowedTypes.includes(file.type)) {
            setValidationErrors(['Invalid file type. Only JPEG, PNG, WebP allowed.']);
            return;
        }

        if (file.size > maxSize) {
            setValidationErrors(['File too large. Maximum size is 20MB.']);
            return;
        }
        
        setSelectedFile(file);
        setValidationErrors([]);
    }

    async function handleSubmit() {
        // Validation
        const errors = [];
        
        if (!selectedFile) errors.push('Select a file');
        if (!selectedStyle) errors.push('Select a drawing style');
        if (!drawingName) errors.push('Provide a name for your drawing');

        // Update the state to render errors
        setValidationErrors(errors);

        if (errors.length > 0) return;

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('style', selectedStyle);
        formData.append('name', drawingName);
        if (selectedProjectId) formData.append('projectId', selectedProjectId);

        await uploadImage(formData);
    }

    return(
        <div>
            <FileDropzone 
                selectedFile={selectedFile} 
                onFileSelect={handleFileSelect}
                disabled={status === 'uploading' || status === 'processing'}
            />

            <StyleSelector
                selectedStyle={selectedStyle}
                onStyleSelect={setSelectedStyle}
            />

            <input
                value={drawingName}
                onChange={(e) => setDrawingName(e.target.value)}
                placeholder='Drawing name'
            />

            {user && <ProjectSelector
                onSelectProject={setSelectedProjectId}
            />}

            {validationErrors.length > 0 && (
                <div>
                    {validationErrors.map((error, index) => {
                        return <ErrorMessage key={index} message={error} />
                    })}
                </div> 
            )}

            {status === 'uploading' && <UploadProgress status='uploading' progress={uploadProgress} />}
            {status === 'processing' && <UploadProgress status='processing' progress={uploadProgress} />}
            {status === 'error' && <ErrorMessage message={error} />}
            {status === 'success' && <SuccessMessage message={`Success! Drawing ID: ${drawingId}`} />}

            <button 
                className="btn btn-secondary"
                onClick={handleSubmit}
                disabled={status === 'uploading' || status === 'processing'}
            >
                Upload
            </button>
        </div>
    );
}