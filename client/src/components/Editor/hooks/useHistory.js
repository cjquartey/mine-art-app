import { useReducer } from "react";

function stateReducer(state, action) {
    switch(action.type) {
        case 'push':
            return {
                stack: [...state.stack.slice(0, state.index + 1), action.payload],
                index: state.index + 1
            }
        case 'undo':
            return {
                ...state,
                index: state.index - 1
            }
        case 'redo':
            return {
                ...state,
                index: state.index + 1
            }
        default:
            return state
    }
}

const initialState = {
    stack: [],
    index: -1
}

export function useHistory() {
    const [state, dispatch] = useReducer(stateReducer, initialState);
    
    const canRedo = state.index < state.stack.length - 1;
    const canUndo = state.index > 0;

    function pushSnapshot(svgString, panOffset) {
        dispatch({
            type: 'push',
            payload: {svgString, panOffset}
        });
    }

    function undo() {
        if (canUndo){
            dispatch({type: 'undo'});
            return state.stack[state.index - 1];
        } else {
            return null;
        }
    }

    function redo() {
        if (canRedo){
            dispatch({type: 'redo'});
            return state.stack[state.index + 1];
        } else {
            return null
        }
    }

    return {
        canUndo,
        canRedo,
        pushSnapshot,
        undo,
        redo
    }
}