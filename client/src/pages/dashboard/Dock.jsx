import {ProfileIcon, ProjectsIcon, CanvasIcon, HelpIcon} from '../../icons';

export function Dock({ activeTab, setActiveTab }) {
    const dockItems = [
        {id: 'projects', label: 'Projects', icon: <ProjectsIcon />},
        {id: 'profile', label: 'Profile', icon: <ProfileIcon />},
        {id: 'canvas', label: 'Canvas', icon: <CanvasIcon />},
        {id: 'help', label: 'Help', icon: <HelpIcon />}
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