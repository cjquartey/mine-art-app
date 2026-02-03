import { useState } from "react";
import { useProjectsContext } from "../../hooks/useProjectsContext";
import { ErrorMessage } from "../ErrorMessage";

export function CreateProjectModal({isOpen, onClose, onProjectCreated}) {
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const {createProject} = useProjectsContext();

    async function handleCreate() {
        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setLoading(true);
        setError(null);
        
        try{
            const newProject = await createProject(projectName);
            if(onProjectCreated) onProjectCreated(newProject);
            setProjectName('');
            onClose();
        } catch(error) {
            setError(error.message);
        } finally {
            setLoading(false)
        }
    }
    return(
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Project Name</legend>
                            <input 
                                type="text" 
                                placeholder="Type here" 
                                className="input" 
                                onChange={(e) => setProjectName(e.target.value)}
                                value={projectName}
                            />

                            {/*
                                To be implemented later
                                Will require modifying the create project endpoint to allow for collaborators array
                            */}
                            <legend className="fieldset-legend">Collaborators</legend>
                            <label className="input">
                                <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <g
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    strokeWidth="2.5"
                                    fill="none"
                                    stroke="currentColor"
                                    >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.3-4.3"></path>
                                    </g>
                                </svg>
                                <input type="search" className="grow" placeholder="Search" />
                            </label>

                            {error && <ErrorMessage message={error} />}
                            <button 
                                className="btn btn-success" 
                                type="button" 
                                onClick={handleCreate}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Confirm'}
                            </button>
                            <button 
                                className="btn btn-error" 
                                type="button" 
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </fieldset>
                    </div>
                </div>

            )}
        </>
    )
}