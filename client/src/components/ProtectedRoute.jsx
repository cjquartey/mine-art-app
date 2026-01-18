import {Navigate, useLocation} from 'react-router-dom';
import {useAuthContext} from '../hooks/useAuthContext';

export function ProtectedRoute({children}) {
  const {user, loading} = useAuthContext();
  const location = useLocation();

  // Display a spinner while the page
  if (loading) {
    return(
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  // Redirect to login page if user isn't signed in
  if (!user) {
    return <Navigate to="/login" replace state={{from: location}} />;
  }

  return children;
}