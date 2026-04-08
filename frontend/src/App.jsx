import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login        from './pages/Login';
import Register     from './pages/Register';
import RoleSelect   from './pages/RoleSelect';
import DonorForm    from './pages/DonorForm';
import HospitalForm from './pages/HospitalForm';
import ScreeningForm     from './pages/ScreeningForm';
import DonorDashboard    from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BloodTesting from './pages/BloodTesting';

function ProtectedRoute({ children, allowedRole }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (allowedRole && auth.user.role !== allowedRole)
    return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"               element={<Navigate to="/login" replace />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/role-select"    element={<RoleSelect />} />

      <Route path="/donor-form"     element={<ProtectedRoute allowedRole="DONOR"><DonorForm /></ProtectedRoute>} />
      <Route path="/screening"      element={<ProtectedRoute allowedRole="DONOR"><ScreeningForm /></ProtectedRoute>} />
      <Route path="/donor-dashboard"element={<ProtectedRoute allowedRole="DONOR"><DonorDashboard /></ProtectedRoute>} />

      <Route path="/hospital-form"      element={<ProtectedRoute allowedRole="HOSPITAL"><HospitalForm /></ProtectedRoute>} />
      <Route path="/hospital-dashboard" element={<ProtectedRoute allowedRole="HOSPITAL"><HospitalDashboard /></ProtectedRoute>} />

      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/testing" element={<ProtectedRoute allowedRole="ADMIN"><BloodTesting /></ProtectedRoute>} />
      {/* <Route path="/admin/testing" element={<BloodTesting />} /> */}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}