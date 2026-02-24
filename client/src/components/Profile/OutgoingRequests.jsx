import { useCollaborationsContext } from "../../hooks/useCollaborationsContext";
import { SectionHeader } from "../SectionHeader";

export function OutgoingRequests() {
    const {sentRequests} = useCollaborationsContext();

    if (sentRequests.length === 0) {
        return (
            <>
                <SectionHeader text={"Outgoing Requests"} />
                <div role="alert" className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>No sent requests</span>
                </div>
            </>
        )
    }

    return(
        <div>
            <SectionHeader text={"Outgoing Requests"} />
                
            <ul className="list bg-base-100 rounded-box shadow-md">
                {sentRequests.map((request, index) => {
                    return(
                        <li className="list-row" key={request._id}>
                            <div className="text-4xl font-thin opacity-30 tabular-nums">{index + 1}</div>
                            <div className="list-col-grow">
                            <div>{request.projectId.name}</div>
                            <div>To: {request.recipientId.firstName} {request.recipientId.lastName}, ({request.recipientId.username})</div>
                            <div className="text-xs uppercase font-semibold opacity-60">Status: {request.status}</div>
                            </div>
                        </li>
                        )
                    })}
            </ul>
        </div>
    )
}