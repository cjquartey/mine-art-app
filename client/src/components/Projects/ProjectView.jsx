import { NavLink } from "react-router-dom"
import {useState, useEffect} from 'react'
import { DrawingCard } from "../Drawings/DrawingCard"
import { CancelIcon } from "../../icons"
import { useProjectsContext } from "../../hooks/useProjectsContext"
import { ErrorMessage } from "../ErrorMessage";
import {useParams} from "react-router-dom";
import { LoadingSpinner } from "../LoadingSpinner"

export function ProjectView({projectId: propProjectId}) {
    const {id: paramId} = useParams();
    const projectId = propProjectId || paramId;
    const {getProject, updateProject} = useProjectsContext();
    const [project, setProject] = useState(null);
    const [projectDrawings, setProjectDrawings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        async function fetchProject() {
            setLoading(true);
            try{
                const data = await getProject(projectId);
                setProject(data.project);
                setProjectDrawings(data.projectDrawings);
            } catch (error) {
                setFetchError(error);
            } finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [projectId]);

    async function handleCollabRemove(collaboratorId) { 
        const newCollaborators = project.collaborators.filter(collaborator => collaborator._id !== collaboratorId);
        const updateData = {
            projectId: project._id,
            name: project.name,
            collaboratorIds: newCollaborators.map(c => c._id)
        }
        try{
            const data = await updateProject(updateData);
            setProject(data.project);
        } catch(error) {
            setUpdateError(error);
        }
    }

    if (loading) return <LoadingSpinner message={'Loading project...'} />
    if (fetchError) return <ErrorMessage message={fetchError} />
    if (!project) return null;

    if (projectDrawings.length === 0){
        return (
            <>
                <div role="alert" className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>No drawings yet. Create one now!</span>
                </div>

                <ul className="list bg-base-100 rounded-box shadow-md">
  
                    <li className="p-4 pb-2 text-xl opacity-60 tracking-wide">Collaborators</li>
    
                    {project.collaborators.length > 0 ? (
                        <>
                            {project.collaborators.map((collaborator, index) => (
                                <li className="list-row" key={collaborator._id}>
                                    <div className="text-4xl font-thin opacity-30 tabular-nums">{index + 1}</div>
                                    <div><img className="size-10 rounded-box" src="https://img.daisyui.com/images/profile/demo/1@94.webp"/></div>
                                    <div className="list-col-grow">
                                    <div>{collaborator.firstName} {collaborator.lastName}</div>
                                    <div className="text-xs font-semibold opacity-60">{collaborator.username}</div>
                                    </div>
                                    <button className="btn btn-square btn-ghost" onClick={() => handleCollabRemove(collaborator._id)}>
                                        <CancelIcon />
                                    </button>
                                </li>
                            ))}     
                        </>
                    ) : (
                        <span>None</span>
                    )}

                </ul>

                <NavLink className="btn btn-accent" to="/dashboard" state={{activeTab: 'canvas'}}>Create new drawing</NavLink>
            </>
        )
    }

    return (
        <>
            <div role="alert" className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>This project has {projectDrawings.length} drawings</span>
            </div>

            {updateError && <ErrorMessage message={updateError} />}

            <ul className="list bg-base-100 rounded-box shadow-md">
  
                <li className="p-4 pb-2 text-xl opacity-60 tracking-wide">Collaborators</li>
  
                {project.collaborators.length > 0 ? (
                    <>
                        {project.collaborators.map((collaborator, index) => (
                            <li className="list-row" key={collaborator._id}>
                                <div className="text-4xl font-thin opacity-30 tabular-nums">{index + 1}</div>
                                <div><img className="size-10 rounded-box" src="https://img.daisyui.com/images/profile/demo/1@94.webp"/></div>
                                <div className="list-col-grow">
                                <div>{collaborator.firstName} {collaborator.lastName}</div>
                                <div className="text-xs font-semibold opacity-60">{collaborator.username}</div>
                                </div>
                                <button className="btn btn-square btn-ghost" onClick={() => handleCollabRemove(collaborator._id)}>
                                    <CancelIcon />
                                </button>
                            </li>
                        ))}     
                    </>
                ) : (
                    <span>None</span>
                )}

            </ul>
            {projectDrawings.map(drawing => (
                <DrawingCard key={drawing._id} drawing={drawing} />
            ))}
        </>
    )
}