import { useSearch } from "../hooks/useSearch";
import { useState } from "react";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingSpinner } from "./LoadingSpinner";
import { AddUserIcon } from "../icons";

export function UserSearch({collaborators, addCollaborator, removeCollaborator}) {
    const [query, setQuery] = useState("");
    const {loading, results, error} = useSearch(query);

    return (
        <>
            <label className="input">
                <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                    >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                    </g>
                </svg>
                <input 
                    type="search" 
                    className="grow" 
                    placeholder="Search for collaborators"
                    onChange={(event) => setQuery(event.target.value)}
                />
            </label>
            
            {error && <ErrorMessage message={error} />}
            {loading && <LoadingSpinner />}
            {results.length > 0 && (
                <ul className="list bg-base-100 rounded-box shadow-md">
    
                <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Mine Art Users</li>
                {results.map(user => {
                    return (
                        <li className="list-row" key={user._id}>
                            <div>
                            <div>{user.firstName} {user.lastName}</div>
                            <div className="text-xs font-semibold opacity-60">{user.username}</div>
                            </div>
                            <button className="btn btn-ghost" onClick={() => addCollaborator(user)}>
                                <AddUserIcon />
                                Add
                            </button>
                        </li>
                    )
                })}
                </ul>
            )}

            {collaborators.length > 0 && (
                <>
                    <span>Selected Collaborators</span>
                    <ul className="menu bg-base-200 rounded-box w-56">
                        {collaborators.map(collaborator => {
                            return(
                                <li key={collaborator._id}>
                                    <p>Name: {collaborator.firstName} {collaborator.lastName}, ({collaborator.username})</p>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => removeCollaborator(collaborator._id)}
                                    >Remove
                                    </button>
                                </li>
                            )  
                        })}
                    </ul>
                </>
            )}
        </>
    )
}