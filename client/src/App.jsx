import { Routes, Route } from 'react-router-dom';
import './App.css';
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

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
      </Routes>
    </>
  )
}

export default App
