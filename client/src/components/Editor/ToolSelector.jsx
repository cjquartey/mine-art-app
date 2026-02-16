import { CursorIcon, PanIcon } from "../../icons";

export function ToolSelector({activeTool, onToolSelect}) {
    const tools = [
        {type: 'Select', icon: <CursorIcon />},
        {type: 'Pan', icon: <PanIcon />}
    ];

    return (
        <div className="flex gap-4">
            {tools.map(tool =>
                <ToolbarButton
                    key={tool.type}
                    type={tool.type}
                    icon={tool.icon}
                    isActive={tool.type === activeTool}
                    onToolSelect={onToolSelect}
                />
            )}
        </div>
    )
}

function ToolbarButton({type, icon, isActive, onToolSelect}){
    return (
        <div className="tooltip tooltip-bottom" data-tip={type}>
            <button className={`btn btn-square ${isActive ? 'btn-active' : ''}`} onClick={() => onToolSelect(type)}>
                {icon}
            </button>
        </div>
    )
}