import { useCollaborationsContext } from "../../hooks/useCollaborationsContext";
import { SectionHeader } from "../SectionHeader";

export function IncomingRequests() {
    const {acceptRequest, rejectRequest, receivedRequests} = useCollaborationsContext();

    if (receivedRequests.length === 0) {
        return (
            <>
                <SectionHeader text={"Incoming Requests"} />
                <div role="alert" className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>No received requests</span>
                </div>
            </>
        )
    }

    async function handleAccept(collabRequestId) {
        try {
            await acceptRequest(collabRequestId);
        } catch(error) {
            console.error(error);
        }
    }

    async function handleReject(collabRequestId) {
        try {
            await rejectRequest(collabRequestId);
        } catch(error) {
            console.error(error);
        }
    }

    return (
        <div>
            <SectionHeader text={"Incoming Requests"} />
            
            <ul className="list bg-base-100 rounded-box shadow-md">            
                {receivedRequests.map((request, index) => {
                    if (request.status === 'pending'){
                        return(
                            <li className="list-row" key={request._id}>
                                <div className="text-4xl font-thin opacity-30 tabular-nums">{index + 1}</div>
                                <div className="list-col-grow">
                                <div>{request.projectId.name}</div>
                                <div>From: {request.senderId.firstName} {request.senderId.lastName}, ({request.senderId.username})</div>
                                <div className="text-xs uppercase font-semibold opacity-60">Status: {request.status}</div>
                                </div>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => handleAccept(request._id)}
                                >Accept
                                </button>
                                <button 
                                    className="btn btn-ghost"
                                    onClick={() => handleReject(request._id)}
                                >Reject</button>
                            </li>
                        )
                    }
                    else{
                        return(
                            <li className="list-row" key={request._id}>
                                <div className="text-4xl font-thin opacity-30 tabular-nums">{index + 1}</div>
                                <div className="list-col-grow">
                                <div>{request.projectId.name}</div>
                                <div>From: {request.senderId.firstName} {request.senderId.lastName}, ({request.senderId.username})</div>
                                <div className="text-xs uppercase font-semibold opacity-60">Status: {request.status}</div>
                                </div>
                            </li>
                        )
                    }
                })}
            </ul>
        </div>
    )
}