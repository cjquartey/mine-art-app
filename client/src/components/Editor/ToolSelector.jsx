import { CursorIcon, DeleteIcon, DuplicateIcon, PanIcon, RedoIcon, UndoIcon } from "../../icons";

export function ToolSelector({activeTool, onToolSelect, onToolClick, canUndo, canRedo}) {
    const tools = [
        {name: 'Select', type: 'active', icon: <CursorIcon />},
        {name: 'Pan', type: 'active', icon: <PanIcon />},
        {name: 'Undo', type: 'click', icon: <UndoIcon />},
        {name: 'Redo', type: 'click', icon: <RedoIcon />},
        {name: 'Duplicate', type: 'click', icon: <DuplicateIcon />},
        {name: 'Delete', type: 'click', icon: <DeleteIcon />}
    ];

    return (
        <div className="flex gap-4">
            {tools.map(tool =>
                <ToolbarButton
                    key={tool.name}
                    name={tool.name}
                    icon={tool.icon}
                    type={tool.type}
                    {...(tool.type === 'click' && {
                        onToolClick : onToolClick,
                        canRedo : canRedo,
                        canUndo : canUndo
                    })}
                    {...(tool.type === 'active' && {
                        onToolSelect : onToolSelect, 
                        isActive : (tool.name === activeTool)
                    })}
                />
            )}
        </div>
    )
}

function ToolbarButton({name, icon, type, onToolClick, canRedo, canUndo, isActive, onToolSelect}){
    if (type === 'click'){
        return(
            <div className="tooltip tooltip-bottom" data-tip={name}>
                <button 
                    className={`btn btn-square`}
                    disabled={(name === 'Undo' && !canUndo) || (name === 'Redo' && !canRedo)}
                    onClick={() => onToolClick(name)}
                >
                    {icon}
                </button>
            </div>
        )
    }
    else if (type === 'active') {
        return (
            <div className="tooltip tooltip-bottom" data-tip={name}>
                <button className={`btn btn-square ${isActive ? 'btn-active' : ''}`} onClick={() => onToolSelect(name)}>
                    {icon}
                </button>
            </div>
        )
    }
}