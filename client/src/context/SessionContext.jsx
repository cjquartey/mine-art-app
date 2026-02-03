import {createContext, useState, useEffect} from "react";

const SessionContext = createContext();

function SessionProvider({children}) {
    const [sessionId, setSessionId] = useState(null);

    useEffect(() => {
        // Check local storage for guest user on mount
        function checkGuest() {
            const storedSession = localStorage.getItem('sessionId');
            if (storedSession) setSessionId(storedSession)
        };

        checkGuest();
    }, []);

    function updateSessionId(id) {
        setSessionId(id);
        localStorage.setItem('sessionId', id);
    }

    return (
        <SessionContext.Provider value={{sessionId, setSessionId: updateSessionId}}>
            {children}
        </SessionContext.Provider>
    )
}

export {SessionContext, SessionProvider}