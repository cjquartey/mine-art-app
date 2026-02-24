import { useState } from "react";
import { UserSearch } from "../UserSearch";
import { useProjectsContext } from "../../hooks/useProjectsContext";
import { CancelIcon, UndoIcon } from "../../icons";
import { ErrorMessage } from "../ErrorMessage";
import { useCollaborationsContext } from "../../hooks/useCollaborationsContext";

export function EditProjectModal({isOpen, onClose, project, onProjectUpdated}) {
    const [projectName, setProjectName] = useState(project.name);
    const [removedCollaboratorIds, setRemovedCollaboratorIds] = useState([]);
    const [collaborators, setCollaborators] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const {updateProject} = useProjectsContext();
    const {createRequest} = useCollaborationsContext();

    function addCollaborator(collaborator) {
        if (project.collaborators.some(c => c._id === collaborator._id)) {
            setError('User already added as a collaborator');
            return;
        }
        setCollaborators(prev => {
            if (prev.some(c => c._id === collaborator._id)) return prev;
            else return [...prev, collaborator]
        });
    }
    function removeCollaborator(collaboratorId) {
        setCollaborators(prev => prev.filter(collaborator => collaborator._id !== collaboratorId));
    }

    async function handleProjectUpdate() {
        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setLoading(true);
        setError(null);
        
        const currentCollaborators = project.collaborators;
        const newCollaborators = currentCollaborators.filter(collaborator => !removedCollaboratorIds.includes(collaborator._id));
        const updateData = {
            projectId: project._id,
            name: projectName,
            collaboratorIds: newCollaborators.map(c => c._id)
        }
        try{
            const data = await updateProject(updateData);
            await Promise.all(collaborators.map(
                c => createRequest(c._id, project._id)
            ))
            onProjectUpdated(data.project);
            onClose();
        } catch(error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Project Name</legend>
                            <input 
                                type="text" 
                                className="input" 
                                onChange={(e) => setProjectName(e.target.value)}
                                value={projectName}
                            />

                            <legend className="fieldset-legend">Collaborators</legend>

                            {project.collaborators.length > 0 ? (
                                <ul className="list bg-base-100 rounded-box shadow-md">
                                    {project.collaborators.map((collaborator, index) => (
                                        <li className="list-row" key={collaborator._id}>
                                            <div className="text-4xl font-thin opacity-30 tabular-nums">{index + 1}</div>
                                            <div className="list-col-grow">
                                            <div>{collaborator.firstName} {collaborator.lastName}</div>
                                            <div className="text-xs font-semibold opacity-60">{collaborator.username}</div>
                                            {removedCollaboratorIds.includes(collaborator._id) ? (
                                                <>
                                                <span>Selected for removal</span>
                                                <button className="btn btn-square btn-ghost" onClick={() => setRemovedCollaboratorIds(prev => prev.filter(collab_id => collab_id !== collaborator._id))}>
                                                    <UndoIcon />
                                                </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Remove collaborator</span>
                                                    <button className="btn btn-square btn-ghost" onClick={() => setRemovedCollaboratorIds(prev => [...prev, collaborator._id])}>
                                                        <CancelIcon />
                                                    </button>
                                                </>
                                            )}
                                            </div>
                                        </li>
                                    ))}     
                                </ul>
                            ) : (
                                <span>None</span>
                            )}

                            <UserSearch 
                                collaborators={collaborators}
                                addCollaborator={addCollaborator}
                                removeCollaborator={removeCollaborator}
                            />

                            {error && <ErrorMessage message={error} />}
                            <button 
                                className="btn btn-success" 
                                type="button" 
                                onClick={handleProjectUpdate}
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Confirm'}
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