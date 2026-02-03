import { ErrorMessage } from "../ErrorMessage";
import {useCallback, useEffect} from 'react';
import {useDropzone} from 'react-dropzone'

export function FileDropzone({selectedFile, onFileSelect, disabled}) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            const file = acceptedFiles[0];
            onFileSelect(Object.assign(file, {
                preview: URL.createObjectURL(file)
            }));
        }        
    }, [onFileSelect]);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop, 
        maxFiles:1,
        disabled
    });

    // Cleanup preview URL on unmount or file change
    useEffect(() => {
        return () => {
            if (selectedFile?.preview) {
                URL.revokeObjectURL(selectedFile.preview);
            }
        };
    }, [selectedFile]);

    return (
        <div className="flex items-center justify-center w-full">
            {!selectedFile ? (
                <div {...getRootProps()} className="w-full">
                    <input {...getInputProps()} />
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium">
                        <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/>
                            </svg>
                            {isDragActive ? (
                                <p>Drop the file here...</p>
                            ) : (
                                <>
                                    <p className="mb-2 text-sm">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs">PNG, JPG, or WEBP (MAX. 20MB)</p>
                                </>
                            )}
                        </div>
                    </label>
                </div>
            ) : (
                <div className="card bg-base-100 w-96 shadow-sm">
                    <figure className="px-10 pt-10">
                        <img
                            src={selectedFile.preview}
                            alt="Selected file preview"
                            className="rounded-xl" 
                        />
                    </figure>
                    <div className="card-body items-center text-center">
                        <h2 className="card-title">{selectedFile.name}</h2>
                        <p className="text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <div className="card-actions">
                            <button 
                                type="button"
                                className="btn btn-primary"
                                onClick={() => onFileSelect(null)}
                                disabled={disabled}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}