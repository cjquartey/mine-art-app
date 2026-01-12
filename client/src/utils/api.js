import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Request interceptor
api.interceptors.request.use(
    function (config) {
        // Attach an access token to the header of outgoing requests
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    function (response) {
        // Return response without modification for general use
        return response;
    },
    function (error) {
        // Global error handling
        if (error.response) {
            const statusCode = error.response.status;
            const errorMessage = error.response.data.message || 'An error occurred!';

            // Handle different error codes
            if (statusCode === 401) {
                localStorage.removeItem('token');
                console.error('UNAUTHORIZED! Redirecting to login');
                if (window.location.pathname !== '/login') window.location.href = '/login';
            }
            else if (statusCode === 403) {
                console.error('FORBIDDEN! Redirecting to dashboard');
            }
            else if (statusCode === 500) console.error('SERVER ERROR! try again later');
            else console.error(`${statusCode} ERROR! ${errorMessage}`);
        } else if (error.request) {
            // No response received
            console.error('NETWORK ERROR!');
        } else {
            // Final block to handle other errors
            console.error(`REQUEST ERROR! ${error.message}`)
        }

        return Promise.reject(error);
    }
);

export default api;