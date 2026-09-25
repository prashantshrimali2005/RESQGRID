import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './style.css';

// We will create these shortly
import HomePage from './pages/home';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import ReportPage from './pages/report';
import TrackingPage from './pages/tracking';
import ProfilePage from './pages/profile';
import MapPage from './pages/map';
import AuthorityPortal from './pages/authority';
import AlertsPage from './pages/alerts';
import OnboardingPage from './pages/onboarding';
import ExplorePage from './pages/explore';
import AdminLoginPage from './pages/adminLogin';
import ResourcesPage from './pages/resources';
import VolunteersPage from './pages/volunteers';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/how-it-works" element={<HomePage />} />
          <Route path="/about" element={<HomePage />} />
          <Route path="/report-an-issue" element={<Navigate to="/report" replace />} />
          <Route path="/platform" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin" element={<AuthorityPortal />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/notifications" element={<AlertsPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/volunteers" element={<VolunteersPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
