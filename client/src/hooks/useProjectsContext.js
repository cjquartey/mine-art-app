import {useContext} from 'react';
import { ProjectsContext } from '../context/ProjectsContext';

export function useProjectsContext() {
    return useContext(ProjectsContext);
}