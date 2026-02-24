import { useState, useEffect } from "react";
import api from "../utils/api";

export function useSearch(query) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const handler = setTimeout(async() => {
            setLoading(true);
            setError(null);

            try {
                const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
                setResults(response.data.users);
            } catch(error) {
                setError(error.response?.data?.message);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(handler)
    }, [query]);

    return {
        results,
        loading, 
        error
    }
}