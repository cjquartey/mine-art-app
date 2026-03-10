import { useState, useEffect, useRef } from "react";
import { CursorIcon, DeleteIcon, DrawIcon, DuplicateIcon, FindIcon, GroupIcon, PanIcon, RedoIcon, SplitIcon, UndoIcon } from "../../icons";
import {BlockPicker} from 'react-color';

export function ToolSelector({activeTool, onToolSelect, onToolClick, canUndo, canRedo, drawWidth, onDrawWidthChange, strokeColour, onColourChange}) {
    const [showDrawSlider, setShowDrawSlider] = useState(false);
    const drawToolRef = useRef(null);

    useEffect(() => {
        if (!showDrawSlider) return;

        function handleClickOutside(e) {
            if (!drawToolRef.current?.contains(e.target)) setShowDrawSlider(false);
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDrawSlider]);

    const tools = [
        {name: 'Select', type: 'active', icon: <CursorIcon />},
        {name: 'Select All', type: 'click', icon: <GroupIcon />},
        {name: 'Find All Paths', type: 'click', icon: <FindIcon />},
        {name: 'Pan', type: 'active', icon: <PanIcon />},
        {name: 'Draw', type: 'active', icon: <DrawIcon />},
        {name: 'Split', type: 'active', icon: <SplitIcon />},
        {name: 'Undo', type: 'click', icon: <UndoIcon />},
        {name: 'Redo', type: 'click', icon: <RedoIcon />},
        {name: 'Duplicate', type: 'click', icon: <DuplicateIcon />},
        {name: 'Delete', type: 'click', icon: <DeleteIcon />}
    ];

    return (
        <div className="flex gap-4">
            {tools.map(tool => {
                if (tool.name === 'Draw') {
                    return (
                        <div key={tool.name} className="relative" ref={drawToolRef}>
                            <div className="tooltip tooltip-bottom" data-tip="Draw">
                                <button
                                    className={`btn btn-square ${activeTool === 'Draw' ? 'btn-active' : ''}`}
                                    onClick={() => {
                                        onToolSelect('Draw');
                                        setShowDrawSlider(true);
                                    }}
                                >
                                    <DrawIcon />
                                </button>
                            </div>
                            {showDrawSlider && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 bg-base-200 rounded-box shadow-lg p-3 flex flex-col items-center gap-1 w-32">
                                    <span className="text-xs font-medium">{drawWidth} px</span>
                                    <input
                                        type="range"
                                        min={1}
                                        max={50}
                                        value={drawWidth}
                                        onChange={e => onDrawWidthChange(Number(e.target.value))}
                                        onPointerUp={() => setShowDrawSlider(false)}
                                        className="range range-neutral range-xs w-full"
                                    />
                                    <BlockPicker
                                        color={strokeColour}
                                        onChangeComplete={color => onColourChange(color)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <ToolbarButton
                        key={tool.name}
                        name={tool.name}
                        icon={tool.icon}
                        type={tool.type}
                        {...(tool.type === 'click' && {
                            onToolClick: onToolClick,
                            canRedo: canRedo,
                            canUndo: canUndo
                        })}
                        {...(tool.type === 'active' && {
                            onToolSelect: onToolSelect,
                            isActive: (tool.name === activeTool)
                        })}
                    />
                );
            })}
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