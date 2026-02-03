import {useState} from 'react';
import {CreateProjectModal} from './CreateProjectModal';
import { useProjectsContext } from '../../hooks/useProjectsContext';

export function ProjectSelector({onSelectProject}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState('');
    const {ownedProjects, collabProjects} = useProjectsContext();

    function handleChange(e) {
        const value = e.target.value;
        if (value === 'create') {
            setIsModalOpen(true);
            setSelectedValue('');
            return;
        }
        setSelectedValue(value);
        onSelectProject(value === 'standalone' ? null : value);
    };

    return (
        <>
            <select value={selectedValue} onChange={handleChange} className="select select-secondary">
                <option value="" disabled>Select a project</option>

                {ownedProjects.length > 0 && (
                    <optgroup label="My Projects" >
                        {ownedProjects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.name}
                            </option>
                        ))}
                    </optgroup>
                )}

                {collabProjects.length > 0 && (
                    <optgroup label="Collaborations" >
                        {collabProjects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.name}
                            </option>
                        ))}
                    </optgroup>
                )}

                <option value="standalone">No project - standalone drawing</option>
                <option value="create">+ Create new project</option>
            </select>

            {isModalOpen && (
                <CreateProjectModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onProjectCreated={(newProject) => {
                        setSelectedValue(newProject._id);
                        onSelectProject(newProject._id);
                    }}
                />
            )}
        </>
    )
}