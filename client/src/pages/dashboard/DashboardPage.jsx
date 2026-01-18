import {useAuthContext} from '../../hooks/useAuthContext';
import {Dock} from './Dock'

export function DashboardPage() {
    const {user} = useAuthContext();

    return(
        <>
            <h1>Your projects, {user.username}</h1>
            <Dock />
        </>
    );
};