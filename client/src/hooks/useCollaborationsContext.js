import {useContext} from 'react';
import {CollaborationsContext} from '../context/CollaborationsContext';

export function useCollaborationsContext() {
    return useContext(CollaborationsContext);
}