import { useState, useEffect } from "react";
import { useProjectsContext } from "../../hooks/useProjectsContext";
import { ProjectCard } from "./ProjectCard";
import { SectionHeader } from "../SectionHeader";
import {CreateProjectModal} from "./CreateProjectModal";
import { LoadingSpinner } from "../LoadingSpinner";
import { SuccessMessage } from "../SuccessMessage";
import { ErrorMessage } from "../ErrorMessage";

export function ProjectList() {
    const {
        ownedProjects, 
        collabProjects, 
        loading, 
        fetchProjects, 
        deleteProject
    } = useProjectsContext();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProjectDeleted, setIsProjectDeleted] = useState(false);
    const [deletedProjectMessage, setDeletedProjectMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    async function handleDelete(projectId) {
        // Implement custom alert for confirmation
        try{
            const deletedMessage = await deleteProject(projectId);
            setDeletedProjectMessage(deletedMessage);
            setIsProjectDeleted(true);
        } catch(error) {
            setError(error.message);
        }
    }

    if (loading) {
        return <LoadingSpinner message={"Loading projects..."} />
    }

    if (ownedProjects.length === 0 && collabProjects.length === 0) {
        return (
            <>
                <div role="alert" className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>No projects yet. Create one now!</span>
                </div>

                <button className="btn btn-primary"type="button" onClick={() => setIsModalOpen(true)}>Create new project</button>
                {isModalOpen && (
                    <CreateProjectModal 
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </>
        )
    }

    return (
        <>
            <div role="alert" className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>You have {ownedProjects.length + collabProjects.length} project(s)</span>
            </div>

            {isProjectDeleted && <SuccessMessage message={deletedProjectMessage} />}
            {error && <ErrorMessage message={error} />}
        
            <SectionHeader text={"Owned Projects"} />
            {ownedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ownedProjects.map(project => (
                        <ProjectCard key={project._id} project={project} onProjectDelete={handleDelete} />
                    ))}
                </div>  
            ) : (
                <p>No owned projects</p>
            )}

            <SectionHeader text={"Collaborative Projects"} />
            {collabProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collabProjects.map(project => (
                        <ProjectCard key={project._id} project={project} onProjectDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <p>No collaborative projects</p>
            )}

            <button type="button" onClick={() => setIsModalOpen(true)}>Create new project</button>
            {isModalOpen && (
                <CreateProjectModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}