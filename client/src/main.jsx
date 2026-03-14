import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext';
import { ProjectsProvider } from './context/ProjectsContext'
import { SessionProvider } from './context/SessionContext.jsx'
import App from './App.jsx'
import { CollaborationsProvider } from './context/CollaborationsContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <ProjectsProvider>
            <CollaborationsProvider>
              <SocketProvider>
                <App />
              </SocketProvider>
            </CollaborationsProvider>
          </ProjectsProvider>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)