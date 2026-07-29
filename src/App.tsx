import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingScreen } from './components/ui/Loading';
import type { UserRole } from './types';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { WorkerDashboard } from './pages/WorkerDashboard';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { ComplaintsListPage } from './pages/ComplaintsListPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { TrackPage } from './pages/TrackPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WorkersPage } from './pages/WorkersPage';
import { ProfilePage } from './pages/ProfilePage';
import { TransparencyPage } from './pages/TransparencyPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Loading your dashboard..." />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardRouter() {
  const { profile } = useAuth();
  if (!profile) return <LoadingScreen />;
  switch (profile.role) {
    case 'citizen': return <CitizenDashboard />;
    case 'officer': return <OfficerDashboard />;
    case 'worker': return <WorkerDashboard />;
    default: return <CitizenDashboard />;
  }
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/transparency" element={<TransparencyPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected - all roles */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><ComplaintsListPage /></ProtectedRoute>} />
            <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetailPage /></ProtectedRoute>} />
            <Route path="/track" element={<ProtectedRoute><TrackPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Citizen only */}
            <Route path="/complaints/new" element={<ProtectedRoute roles={['citizen']}><SubmitComplaintPage /></ProtectedRoute>} />

            {/* Officer only */}
            <Route path="/analytics" element={<ProtectedRoute roles={['officer']}><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/workers" element={<ProtectedRoute roles={['officer']}><WorkersPage /></ProtectedRoute>} />
            <Route path="/heatmap" element={<ProtectedRoute roles={['officer']}><TrackPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
