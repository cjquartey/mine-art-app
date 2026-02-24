import { createContext, useState} from "react";
import api from '../utils/api';

const CollaborationsContext = createContext(null);

function CollaborationsProvider({children}) {
    const [sentRequests, setSentRequests] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchRequests() {
        setLoading(true);
        try {
            setError(null);
            const response = await api.get('/collaborations');
            setSentRequests(response.data.sentCollabRequests);
            setReceivedRequests(response.data.receivedCollabRequests);
        } catch(error) {
            setError(error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    }

    async function createRequest(recipientId, projectId) {
        try {
            setError(null);
            await api.post('/collaborations', {recipientId, projectId});
            await fetchRequests();
        } catch(error) {
            setError(error.response?.data?.message);
            throw new Error(error.response?.data?.message);
        }
    }

    async function acceptRequest(collabRequestId) {
        try {
            setError(null);
            await api.patch(`/collaborations/${collabRequestId}/accept`);
            await fetchRequests();
        } catch(error) {
            setError(error.response?.data?.message);
            throw new Error(error.response?.data?.message);
        }
    }

    async function rejectRequest(collabRequestId) {
        try {
            setError(null);
            await api.patch(`/collaborations/${collabRequestId}/reject`);
            await fetchRequests();
        } catch(error) {
            setError(error.response?.data?.message);
            throw new Error(error.response?.data?.message);
        }
    }

    async function leaveCollaboration(projectId) {
        try {
            setError(null);
            await api.delete(`/collaborations/projects/${projectId}/leave`);
            await fetchRequests();
        } catch(error) {
            setError(error.response?.data?.message);
            throw new Error(error.response?.data?.message);
        }
    }

    return (
        <CollaborationsContext.Provider value={{
            sentRequests,
            receivedRequests,
            loading,
            error,
            fetchRequests,
            createRequest,
            acceptRequest,
            rejectRequest,
            leaveCollaboration
        }} >
            {children}
        </CollaborationsContext.Provider>
    );
}

export {CollaborationsContext, CollaborationsProvider};