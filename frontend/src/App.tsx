import type { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { AdminPage } from './pages/AdminPage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { ResumeBuilderPage } from './pages/ResumeBuilderPage';

function Protected({ children, roles }: { children: ReactElement; roles?: string[] }) {
  const { token, user } = useAppSelector((s) => s.auth);
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeGate() {
  const { token, user } = useAppSelector((s) => s.auth);
  if (!token || !user) return <LandingPage />;
  if (user.role === 'recruiter') return <Navigate to="/recruiter" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/candidate" replace />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomeGate />} />
        <Route
          path="/candidate"
          element={
            <Protected roles={['candidate', 'admin']}>
              <CandidateDashboard />
            </Protected>
          }
        />
        <Route
          path="/recruiter"
          element={
            <Protected roles={['recruiter', 'admin']}>
              <RecruiterDashboard />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected roles={['admin']}>
              <AdminPage />
            </Protected>
          }
        />
        <Route
          path="/jobs"
          element={
            <Protected>
              <JobsPage />
            </Protected>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <Protected>
              <JobDetailPage />
            </Protected>
          }
        />
        <Route
          path="/resumes/upload"
          element={
            <Protected roles={['candidate', 'admin']}>
              <ResumeUploadPage />
            </Protected>
          }
        />
        <Route
          path="/builder"
          element={
            <Protected roles={['candidate', 'admin']}>
              <ResumeBuilderPage />
            </Protected>
          }
        />
      </Routes>
    </Layout>
  );
}
