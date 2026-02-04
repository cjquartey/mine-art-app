import { createContext, useState} from "react";
import api from '../utils/api';

const ProjectsContext = createContext(null);

function ProjectsProvider({children}) {
    const [ownedProjects, setOwnedProjects] = useState([]);
    const [collabProjects, setCollabProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function fetchProjects() {
        setLoading(true);
        try {
            const response = await api.get('/projects');
            setOwnedProjects(response.data.userOwnedProjects);
            setCollabProjects(response.data.userCollabProjects);
        } catch(error) {
            setError(error.response?.data?.message);
        } finally {
            setLoading(false);
        }     
    }

    async function createProject(projectName) {
        try {
            const response = await api.post('/projects', {projectName});
            await fetchProjects();
            return response.data.newProject;
        } catch (error) {
            setError(error.response?.data?.message);
            throw new Error(error.response?.data?.message);
        }
    }

    async function deleteProject(projectId) {
        try {
            const response = await api.delete(`/projects/${projectId}`);
            await fetchProjects();
            return response.data.message;
        } catch(error) {
            setError(error.response?.data?.message);
        }
    }

    async function getProject(projectId) {
        setLoading(true);
        try{
            const response = await api.get(`/projects/${projectId}`);
            return ({
                project: response.data.project,
                projectDrawings: response.data.projectDrawings
            })                
        } catch(error) {
            setError(error.response?.data?.message);
            throw new Error(error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateProject(projectData){
        const {projectId, name, collaboratorIds} = projectData;
        try{
            const response = await api.put(`/projects/${projectId}`, {name, collaboratorIds});
            return ({
                project: response.data.project,
                projectDrawings: response.data.projectDrawings
            })
        } catch(error) {
            setError(error.response?.data?.message);
            throw new Error(error.response?.data?.message);
        }    
    }

    return (
        <ProjectsContext.Provider value={{
            ownedProjects, 
            collabProjects,
            loading,
            error,
            createProject, 
            deleteProject, 
            fetchProjects,
            getProject,
            updateProject
        }} >
            {children}
        </ProjectsContext.Provider>
    );
}

export {ProjectsContext, ProjectsProvider};