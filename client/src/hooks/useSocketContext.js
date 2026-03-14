import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

export function useSocketContext() {
    return useContext(SocketContext);
}