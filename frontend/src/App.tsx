import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ManualList from './pages/ManualList';
import ManualDetail from './pages/ManualDetail';
import MyDashboard from './pages/MyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import AllUsersAdmin from './pages/AllUsersAdmin';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminAnnouncementManagement from './pages/AdminAnnouncementManagement';
import OrganizationManagement from './pages/OrganizationManagement';
import ManualEdit from './pages/ManualEdit';
import Layout from './components/Layout';
import ChangePassword from './pages/ChangePassword';
import SetupAccount from './pages/SetupAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DevConsole from './pages/DevConsole';
import SubmissionSuccessPage from './pages/SubmissionSuccessPage';
import TrainingList from './pages/TrainingList';
import TrainingDetail from './pages/TrainingDetail';
import TrainingAdmin from './pages/TrainingAdmin';
import TrainingResponseAdmin from './pages/TrainingResponseAdmin';
import { AuthProvider, useAuth } from './context/AuthContext';


function AppRoutes() {
    const { user, login, loading, isDeveloper, isAdmin } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login onLogin={login} />} />
                <Route path="/setup" element={<SetupAccount onLogin={login} />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    if (user.mustChangePassword) {
        return (
            <Routes>
                <Route path="/change-password" element={<ChangePassword user={user} onComplete={login} />} />
                <Route path="*" element={<Navigate to="/change-password" replace />} />
            </Routes>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Navigate to="/manuals" replace />} />
                <Route path="/manuals" element={<ManualList user={user} />} />
                <Route path="/manuals/:id" element={<ManualDetail user={user} />} />
                <Route path="/my-dashboard" element={<MyDashboard user={user} />} />
                <Route path="/dashboard" element={<Navigate to="/my-dashboard" replace />} />

                {isDeveloper && (
                    <Route path="/developer" element={<DeveloperDashboard />} />
                )}

                <Route path="/training" element={<TrainingList />} />
                <Route path="/training/:id" element={<TrainingDetail />} />

                {(isAdmin || isDeveloper) && (
                    <>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<AdminUserManagement user={user} />} />
                        <Route path="/dev/console" element={<DevConsole />} />
                        <Route path="/admin/manuals/new" element={<ManualEdit user={user} />} />
                        <Route path="/admin/manuals/edit/:id" element={<ManualEdit user={user} />} />
                        <Route path="/admin/all-users" element={<AllUsersAdmin />} />
                        <Route path="/admin/announcements" element={<AdminAnnouncementManagement user={user} />} />
                        <Route path="/admin/training" element={<TrainingAdmin />} />
                        <Route path="/admin/training/responses/:eventId" element={<TrainingResponseAdmin />} />
                    </>
                )}

                {isDeveloper && (
                    <Route path="/admin/organization" element={<OrganizationManagement />} />
                )}

                <Route path="/submission-success" element={<SubmissionSuccessPage />} />
                <Route path="*" element={<Navigate to="/manuals" replace />} />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
