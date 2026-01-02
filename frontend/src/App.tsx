import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingScreen from '@/components/common/LoadingScreen';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Calendar
import CalendarPage from '@/pages/calendar/CalendarPage';

// Appointments
import AppointmentsPage from '@/pages/appointments/AppointmentsPage';
import AppointmentDetailPage from '@/pages/appointments/AppointmentDetailPage';

// Clients
import ClientsPage from '@/pages/clients/ClientsPage';
import ClientDetailPage from '@/pages/clients/ClientDetailPage';

// Services
import ServicesPage from '@/pages/services/ServicesPage';

// Users
import UsersPage from '@/pages/users/UsersPage';

// Settings
import SettingsPage from '@/pages/settings/SettingsPage';

// Profile
import ProfilePage from '@/pages/profile/ProfilePage';

// Public Booking
import PublicBookingPage from '@/pages/booking/PublicBookingPage';

// Admin Pages (Super Admin only - Independent)
import AdminDashboard from '@/pages/admin/AdminDashboard';
import TenantsManagement from '@/pages/admin/TenantsManagement';
import PlansManagement from '@/pages/admin/PlansManagement';
import ActivityPage from '@/pages/admin/ActivityPage';
import PlatformSettings from '@/pages/admin/PlatformSettings';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route wrapper (Super Admin only)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public Booking Routes */}
      <Route path="/book/:subdomain" element={<PublicBookingPage />} />
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes (Super Admin only - Independent Layout) */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tenants" element={<TenantsManagement />} />
        <Route path="/admin/plans" element={<PlansManagement />} />
        <Route path="/admin/activity" element={<ActivityPage />} />
        <Route path="/admin/settings" element={<PlatformSettings />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
