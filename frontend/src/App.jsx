import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Cards from './pages/Cards';
import GenerateCards from './pages/GenerateCards';
import Users from './pages/Users';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import TicketDemo from './pages/TicketDemo';
import Layout from './components/Layout';

const Scanner = lazy(() => import('./pages/Scanner'));

function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (superAdminOnly && user.role !== 'superadmin') {
    return <Navigate to={user.role === 'scanner' ? '/scanner' : '/'} />;
  }

  if (adminOnly && user.role !== 'superadmin' && user.role !== 'subadmin') {
    return <Navigate to="/scanner" />;
  }

  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={
          user.role === 'superadmin' ? '/super-admin' :
          user.role === 'subadmin' ? '/' : '/scanner'
        } /> : <Login />
      } />

      <Route path="/super-admin" element={
        <ProtectedRoute superAdminOnly>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<SuperAdmin />} />
      </Route>

      <Route path="/" element={
        <ProtectedRoute adminOnly>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="activity" element={<Activity />} />
        <Route path="cards" element={<Cards />} />
        <Route path="cards/generate" element={<GenerateCards />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/scanner" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="loading">Loading scanner...</div>}>
            <Scanner />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/ticket-demo" element={<TicketDemo />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
