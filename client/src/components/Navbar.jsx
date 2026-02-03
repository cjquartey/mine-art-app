import {useAuthContext} from "../hooks/useAuthContext";
import {NavLink} from "react-router-dom";
import {LogoutButton} from '../components/LogoutButton';
import {ToggleTheme} from "./ToggleTheme";

export function Navbar() {
    const {user} = useAuthContext();

    return(
        <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
            <div className="flex-1">
                <NavLink to={user ? "/dashboard" : "/"} state={user ? {activeTab: 'home'} : undefined} className="btn btn-ghost text-xl">Mine Art</NavLink>
                {/*Add Logo*/}
            </div>

            {user ? (
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1">
                    <li><span className="hover:transform-none">Welcome, {user.username}</span></li>
                    <li>
                        <details>
                        <summary>Profile</summary>
                        <ul className="bg-base-100 rounded-t-none p-2">
                            <li><NavLink to="/dashboard">Dashboard</NavLink></li>
                            <li><NavLink to="#">My Profile</NavLink></li>
                            <li><LogoutButton /></li>
                        </ul>
                        </details>
                    </li> 
                    </ul>
                </div>
            ): (
                  <div className="flex-none">
                    <ul className="menu menu-horizontal px-1">
                    <li><NavLink to="/login">Login</NavLink></li>
                    <li><NavLink to="/register">Register</NavLink></li>
                    </ul>
                </div>
            )}
            <ToggleTheme />
        </div>
    );
};