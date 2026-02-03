import { useContext } from "react";
import { SessionContext } from "../context/SessionContext";

export function useSessionContext() {
    return useContext(SessionContext);
}