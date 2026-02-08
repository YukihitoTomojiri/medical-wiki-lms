import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User } from './types';
import Login from './pages/Login';
import ManualList from './pages/ManualList';
import ManualDetail from './pages/ManualDetail';
import MyDashboard from './pages/MyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import AllUsersAdmin from './pages/AllUsersAdmin';
import AdminUserManagement from './pages/AdminUserManagement';
import ManualEdit from './pages/ManualEdit';
import Layout from './components/Layout';
import ChangePassword from './pages/ChangePassword';
import SetupAccount from './pages/SetupAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DevConsole from './pages/DevConsole';
import SubmissionSuccessPage from './pages/SubmissionSuccessPage';


function App() {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (!user) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="/setup" element={<SetupAccount onLogin={handleLogin} />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        );
    }

    if (user.mustChangePassword) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/change-password" element={<ChangePassword user={user} onComplete={handleLogin} />} />
                    <Route path="*" element={<Navigate to="/change-password" replace />} />
                </Routes>
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Layout user={user} onLogout={handleLogout}>
                <Routes>
                    <Route path="/" element={<Navigate to="/manuals" replace />} />
                    <Route path="/manuals" element={<ManualList user={user} />} />
                    <Route path="/manuals/:id" element={<ManualDetail user={user} />} />
                    <Route path="/my-dashboard" element={<MyDashboard user={user} />} />
                    <Route path="/dashboard" element={<Navigate to="/my-dashboard" replace />} />
                    {user.role === 'DEVELOPER' && (
                        <Route path="/developer" element={<DeveloperDashboard />} />
                    )}
                    {(user.role === 'ADMIN' || user.role === 'DEVELOPER') && (
                        <>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<AdminUserManagement user={user} />} />
                            <Route path="/dev/console" element={<DevConsole />} />
                            <Route path="/admin/manuals/new" element={<ManualEdit user={user} />} />
                            <Route path="/admin/manuals/edit/:id" element={<ManualEdit user={user} />} />
                            <Route path="/admin/all-users" element={<AllUsersAdmin />} />
                        </>
                    )}
                    <Route path="/submission-success" element={<SubmissionSuccessPage />} />
                    <Route path="*" element={<Navigate to="/manuals" replace />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
