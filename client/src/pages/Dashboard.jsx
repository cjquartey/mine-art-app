import {useAuthContext} from '../hooks/useAuthContext';
import {LogoutButton} from '../components/LogoutButton';
import {Navbar} from '../components/Navbar';

export function DashboardPage() {
    const {user} = useAuthContext();

    return(
        <>
            <h1>Your projects, {user.username}</h1>
        </>
    );
};