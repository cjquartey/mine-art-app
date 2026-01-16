import {useAuthContext} from '../hooks/useAuthContext';
import {useNavigate} from 'react-router-dom';

export function LogoutButton() {
    const {logout} = useAuthContext();
    const navigate = useNavigate();

    function handleLogout() {
        navigate('/', {replace: true});
        logout();
    }
    
    return(
        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 cursor-pointer font-semibold">
            Logout
        </button>
    )
}