import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ModulePage } from '../pages/ModulePage';
import { ServiceRequestsPage } from '../pages/ServiceRequestsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ActivateAccountPage } from '../pages/ActivateAccountPage';
import { useAuth } from '../auth/AuthContext';

function Protected({ children }: { children: React.ReactNode }) {
  const { token, isBootstrapping } = useAuth();
  if (isBootstrapping) return <div className="boot">Loading workspace...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="service-requests" element={<ServiceRequestsPage />} />
        <Route path="incidents" element={<ModulePage moduleKey="incidents" title="Incidents" />} />
        <Route path="problems" element={<ModulePage moduleKey="problems" title="Problems" />} />
        <Route path="changes" element={<ModulePage moduleKey="changes" title="Change Management" />} />
        <Route path="inventory" element={<ModulePage moduleKey="inventory" title="Inventory" />} />
        <Route path="access-management" element={<ModulePage moduleKey="access-management" title="Access Management" />} />
        <Route path="compliance" element={<ModulePage moduleKey="compliance" title="Compliance" />} />
        <Route path="projects-environments" element={<ModulePage moduleKey="projects-environments" title="Projects & Environments" />} />
        <Route path="vendors-licenses" element={<ModulePage moduleKey="vendors-licenses" title="Vendors & Licenses" />} />
        <Route path="reports-analytics" element={<ModulePage moduleKey="reports-analytics" title="Reports & Analytics" />} />
        <Route path="knowledge-base" element={<ModulePage moduleKey="knowledge-base" title="Knowledge Base" />} />
        <Route path="users-teams" element={<ModulePage moduleKey="users-teams" title="Users & Teams" />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
