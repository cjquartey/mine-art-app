import {Dock} from './Dock'
import {useState, useEffect} from 'react';
import { ProjectList } from '../../components/Projects/ProjectList';
import { ImageUploader } from '../../components/Upload/ImageUploader';
import { ProjectView } from '../../components/Projects/ProjectView';
import { useLocation } from 'react-router-dom';
import { ProfilePage } from '../ProfilePage';
import { HelpPage } from '../HelpPage';

export function DashboardPage() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'projects');
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
            case 'help': return <HelpPage />
            case 'profile': return <ProfilePage />
            default: return <ProjectList />
        }
    }

    return(
        <>
            {renderContent()}
            <Dock activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
    );
};