import { useEffect } from "react";
import { IncomingRequests } from "../components/Profile/IncomingRequests";
import { OutgoingRequests } from "../components/Profile/OutgoingRequests";
import { useCollaborationsContext } from "../hooks/useCollaborationsContext";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";

export function ProfilePage() {
    const {loading, error, fetchRequests} = useCollaborationsContext();

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <>
            {error && <ErrorMessage message={error} />}
            {loading ? (
                <LoadingSpinner message={"Loading request..."} />
            ) : (
                <div className="flex w-full">
                    <div className="card bg-base-300 rounded-box grid h-20 grow place-items-center"><IncomingRequests /></div>
                    <div className="divider divider-horizontal"></div>
                    <div className="card bg-base-300 rounded-box grid h-20 grow place-items-center"><OutgoingRequests /></div>
                </div>
            )}
        </>
    )
}