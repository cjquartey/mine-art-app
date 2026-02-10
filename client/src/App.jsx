import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { ProjectView } from './components/Projects/ProjectView';
import { ImageUploader } from './components/Upload/ImageUploader';
import { ProjectList } from './components/Projects/ProjectList';
import { EditorPage } from './pages/EditorPage';

function App() {
  return (
    <>
      <Navbar />
        
      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
        <Route path="/upload" element={<ImageUploader />} />
        <Route path="/editor/:drawingId" element={<EditorPage />} />
      </Routes>
    </>
  );
};

export default App