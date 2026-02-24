import { useState } from "react";
import { useProjectsContext } from "../../hooks/useProjectsContext";
import { useCollaborationsContext } from "../../hooks/useCollaborationsContext";
import { ErrorMessage } from "../ErrorMessage";
import { UserSearch } from "../UserSearch";

export function CreateProjectModal({isOpen, onClose, onProjectCreated}) {
    const [projectName, setProjectName] = useState('');
    const [collaborators, setCollaborators] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const {createProject} = useProjectsContext();
    const {createRequest} = useCollaborationsContext();

    async function handleCreate() {
        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setLoading(true);
        setError(null);
        
        try{
            const newProject = await createProject(projectName);
            await Promise.all(collaborators.map(
                c => createRequest(c._id, newProject._id)
            ))
            if(onProjectCreated) onProjectCreated(newProject);
            setProjectName('');
            setCollaborators([]);
            onClose();
        } catch(error) {
            setError(error.message);
        } finally {
            setLoading(false)
        }
    }

    function addCollaborator(collaborator) {
        setCollaborators(prev => {
            if (prev.some(c => c._id === collaborator._id)) return prev;
            else return [...prev, collaborator]
        });
    }
    function removeCollaborator(collaboratorId) {
        setCollaborators(prev => prev.filter(collaborator => collaborator._id !== collaboratorId));
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

                            <legend className="fieldset-legend">Collaborators</legend>
                            <UserSearch 
                                collaborators={collaborators}
                                addCollaborator={addCollaborator}
                                removeCollaborator={removeCollaborator}
                            />

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