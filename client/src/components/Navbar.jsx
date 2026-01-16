import {useAuthContext} from "../hooks/useAuthContext";
import {NavLink} from "react-router-dom";
import {LogoutButton} from '../components/LogoutButton';

export function Navbar() {
    const {user} = useAuthContext();

    return(
        <nav>
            <ul>
                <li>
                    Logo
                    {/*Make sure the logo is a link to the home page*/}
                </li>

                {user ? (
                    <>
                        <li>
                            Welcome, {user.username}
                        </li>
                        <li>
                            <NavLink to="/dashboard">Dashboard</NavLink>
                        </li>
                        <li>
                            <NavLink to="#">My Profile</NavLink>
                        </li>
                        <li>
                            <LogoutButton />
                        </li>                        
                    </>
                ): (
                    <>
                        <li>
                            <NavLink to="/login">Login</NavLink>
                        </li>
                        <li>
                            <NavLink to="/register">Register</NavLink>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}