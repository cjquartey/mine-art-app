import {useAuthContext} from '../../hooks/useAuthContext';
import {Dock} from './Dock'
import {useState, useEffect} from 'react';
import { ProjectList } from '../../components/Projects/ProjectList';
import { ImageUploader } from '../../components/Upload/ImageUploader';
import { ProjectView } from '../../components/Projects/ProjectView';
import { useLocation } from 'react-router-dom';

export function DashboardPage() {
    const {user} = useAuthContext();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'home');
    const [projectId, setProjectId] = useState(location.state?.projectId || null);

    useEffect(() => {
        function remountComponents() {
            if (location.state?.activeTab) setActiveTab(location.state.activeTab);
            if (location.state?.projectId) setProjectId(location.state.projectId);
        }
        remountComponents();
    }, [location.state]);

    function renderContent() {
        switch(activeTab) {
            case 'projects': return <ProjectList />;
            case 'project': return <ProjectView projectId={projectId} />
            case 'canvas': return <ImageUploader />
            case 'settings': return <div>Settings coming soon</div>
            case 'home':
            default: return <h1>Your projects, {user.username}</h1>
        }
    }

    return(
        <>
            {renderContent()}
            <Dock activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
    );
};