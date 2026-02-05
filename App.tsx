import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/user/UserDashboard';
import Withdraw from './pages/user/Withdraw';
import Affiliate from './pages/user/Affiliate';
import TapGame from './pages/user/TapGame';
import Notifications from './pages/user/Notifications';
import HelpSupport from './pages/user/HelpSupport';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import WithdrawalManagement from './pages/admin/WithdrawalManagement';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSupportChat from './pages/admin/SupportChat';
import AdminSettings from './pages/admin/AdminSettings';
import Settings from './pages/Settings';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === UserRole.ADMIN ? '/admin/dashboard' : '/dashboard'} />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* User Routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><UserDashboard /></ProtectedRoute>} />
      <Route path="/game" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><TapGame /></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><Withdraw /></ProtectedRoute>} />
      <Route path="/affiliate" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><Affiliate /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><Notifications /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><HelpSupport /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/withdrawals" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><WithdrawalManagement /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminNotifications /></ProtectedRoute>} />
      <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminSupportChat /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminSettings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    // --- SECURITY ENHANCEMENTS ---
    
    // 1. Anti-Clickjacking (Prevent running in iframe)
    try {
      if (window.self !== window.top) {
        window.top!.location = window.self.location;
      }
    } catch (e) {
      // If error occurs, we are likely blocked by cross-origin, implying we are framed.
      // We can't easily break out, but we can stop rendering or alert.
    }

    // 2. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 3. Disable Keyboard Shortcuts for Inspector
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <HashRouter>
      <AuthProvider>
        <div onContextMenu={(e) => e.preventDefault()}>
            <AppRoutes />
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;