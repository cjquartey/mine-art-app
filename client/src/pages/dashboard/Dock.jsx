import {useState} from 'react';
import {HomeIcon, SettingsIcon, ProjectsIcon, CanvasIcon} from '../../icons';

export function Dock(){
    const [activeTab, setActiveTab] = useState('home');
    const dockItems = [
        {id: 'home', label: 'Home', icon: <HomeIcon />},
        {id: 'projects', label: 'Projects', icon: <ProjectsIcon />},
        {id: 'canvas', label: 'Canvas', icon: <CanvasIcon />},
        {id: 'settings', label: 'Settings', icon: <SettingsIcon />}
    ];

    return (
        <div className="dock dock-xl">
            {dockItems.map((dockItem) => {
                return (
                    <button
                        key={dockItem.id}
                        className={activeTab===dockItem.id ? "dock-active" : ""}
                        onClick={() => {setActiveTab(dockItem.id)}}
                    >
                        {dockItem.icon}
                        <span className="dock-label text-lg">{dockItem.label}</span>
                    </button>
                )
            })}
        </div>
    )
}