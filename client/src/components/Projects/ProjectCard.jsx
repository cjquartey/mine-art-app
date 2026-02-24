import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';

export function ProjectCard({project, onProjectDelete, onProjectLeave}) {
    const navigate = useNavigate();
    const {user} = useAuthContext();

    async function navigateToProject() {
        navigate('/dashboard', {state: {activeTab: 'project', projectId: project._id}});
    }

    return(
        <div className="card bg-secondary text-secondary-content w-96">
            <div className="card-body">
                <h2 className="card-title">{project.name}</h2>

                {project.collaborators.length === 1 ? (
                    <p>{project.collaborators.length} collaborator</p>
                ) : (
                    <p>{project.collaborators.length} collaborators</p>
                )}           

                <p>Last updated at: {new Date(project.updatedAt).toLocaleDateString()}</p>
                <div className="card-actions justify-end">
                    <button 
                        type="button" 
                        className="btn" 
                        onClick={navigateToProject}
                    >
                        View Project
                    </button>
                    {/*Delete project functionality for owners, leave project functionality for collaborators*/}
                    {project.ownerId === user.userId.toString() ? (
                        <button type="button" className="btn btn-error" onClick={() => onProjectDelete(project._id)}>Delete</button>
                    ) : (
                        <button type="button" className="btn btn-error" onClick={() => onProjectLeave(project._id)}>Leave Project</button>
                    )}
                </div>
            </div>
        </div>
    )
}