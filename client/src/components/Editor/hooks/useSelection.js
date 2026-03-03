import { useState, useCallback } from "react";

export function useSelection() {
    // Using Set for faster search runtime
    const [selectedPathIds, setSelectedPathIds] = useState(new Set());

    const selectPath =  useCallback((pathId, additive=false) => {
        setSelectedPathIds(prevPathIds => {
            if (additive) {
                // Multi-select: toggle the path
                const newPathIds = new Set(prevPathIds);
                if (newPathIds.has(pathId)) newPathIds.delete(pathId);
                else newPathIds.add(pathId);
                return newPathIds;
            }
            else return new Set([pathId]);
        })
    }, []);
    
    const selectAll = useCallback((pathIds) => {
        setSelectedPathIds(new Set(pathIds));
    }, []);

    const deselectPath = useCallback((pathId) => {
        setSelectedPathIds(prevPathIds => {
            if(!prevPathIds.has(pathId)) return prevPathIds;
            const newPathIds = new Set(prevPathIds);
            newPathIds.delete(pathId);
            return newPathIds;
        })
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedPathIds(new Set());
    }, []);

    const isSelected = useCallback((pathId) => {
        return selectedPathIds.has(pathId);
    }, [selectedPathIds]);

    const getSelectionBounds = useCallback((scopeRef) => {
        // Aggregate bounds of all selected paths
        let combinedBounds = null;
        let individualBounds = [];
        selectedPathIds.forEach(pathId => {
            const path = scopeRef.current.project.getItem({name: pathId});
            if (path) {
                combinedBounds = combinedBounds ? combinedBounds.unite(path.bounds) : path.bounds.clone();
                individualBounds.push({
                    bounds: path.bounds,
                    pathId: path.name
                });
            }
        });
        return {combinedBounds, individualBounds};
    }, [selectedPathIds]) ;

    return {
        selectedPathIds,
        selectPath,
        selectAll,
        deselectPath,
        clearSelection,
        isSelected,
        getSelectionBounds
    };
}