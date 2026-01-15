import {useContext} from 'react';
import {AuthContext} from '../context/AuthContext';

// Custom hook to provide access to the global auth state
export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        // Authentication data is protected from components outside the AuthProvider
        throw new Error('useAuthContext must be used within an AuthProvider Component');
    };
    return context;
};