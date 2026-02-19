import { createContext, useState, useEffect } from "react";
import api from '../utils/api';

// Centralised authentication
const AuthContext = createContext(null);

function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for and verify existing token on mount
        async function checkToken() {
            const token = localStorage.getItem('token');
            if (token) {
                try{
                    // Verify token is valid with API endpoint
                    const response = await api.get('/users/profile');
                    // Set user state upon a successful response
                    setUser(response.data.user);
                } catch(error) {
                    // Failed verification  - remove token and user object
                    localStorage.removeItem('token');
                    setUser(null);
                    console.error(`Token verification failed! ${error}`);
                }
            };
            setLoading(false);
        };
        
        checkToken();
    }, []);

    // Helper function to initialise a session by saving the token and setting the user state
    function handleAuthSuccess(response) {
        // Destructure the user object and access token
        const {user, accessToken} = response.data;

        // Store the access token in local storage
        localStorage.setItem('token', accessToken);

        // Update the user state
        setUser(user);
    };

    async function login(email, password) {
        const response = await api.post('/auth/login', {email, password});
        handleAuthSuccess(response);
    };

    async function register(userData) {
        const response = await api.post('/auth/register', userData);
        handleAuthSuccess(response);
    };

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    };

    return(
        <AuthContext.Provider value={{user, loading, login, register, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export {AuthContext, AuthProvider};