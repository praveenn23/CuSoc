import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventPage from './pages/EventPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';

/** Simple guard: checks if admin_token exists in localStorage */
function RequireAdmin({ children }) {
  const isLoggedIn = Boolean(localStorage.getItem('admin_token'));
  return isLoggedIn ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(Boolean(localStorage.getItem('admin_token')));

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Event Page ── */}
        <Route path="/" element={<EventPage />} />

        {/* ── Admin Login ── */}
        <Route
          path="/admin/login"
          element={
            isAdmin
              ? <Navigate to="/admin" replace />
              : <AdminLoginPage onLogin={() => setIsAdmin(true)} />
          }
        />

        {/* ── Protected Admin Dashboard ── */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage onLogout={() => setIsAdmin(false)} />
            </RequireAdmin>
          }
        />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
