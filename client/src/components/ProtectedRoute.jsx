import {Navigate, useLocation} from 'react-router-dom';
import {useAuthContext} from '../hooks/useAuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export function ProtectedRoute({children}) {
  const {user, loading} = useAuthContext();
  const location = useLocation();

  // Display a spinner while the page
  if (loading) {
    return(
        <LoadingSpinner />
    );
  }

  // Redirect to login page if user isn't signed in
  if (!user) {
    return <Navigate to="/login" replace state={{from: location}} />;
  }

  return children;
}