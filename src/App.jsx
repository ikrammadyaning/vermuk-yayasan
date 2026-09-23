import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import OfficeLocations from "./pages/OfficeLocations";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterFace from "./pages/RegisterFace";
import { getCurrentEmployee, isAdmin } from "./services/authService";

function Protected({ children }) {
  return getCurrentEmployee() ? children : <Navigate to="/login" replace />;
}

function StaffOnly({ children }) {
  const employee = getCurrentEmployee();
  if (!employee) return <Navigate to="/login" replace />;
  return isAdmin(employee) ? <Navigate to="/history" replace /> : children;
}

function AdminOnly({ children }) {
  const employee = getCurrentEmployee();
  if (!employee) return <Navigate to="/login" replace />;
  return isAdmin(employee) ? children : <Navigate to="/dashboard" replace />;
}

function AppLayout({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-face" element={<StaffOnly><RegisterFace /></StaffOnly>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Protected><StaffOnly><AppLayout><Dashboard /></AppLayout></StaffOnly></Protected>} />
      <Route path="/attendance" element={<Protected><StaffOnly><AppLayout><Attendance /></AppLayout></StaffOnly></Protected>} />
      <Route path="/history" element={<AdminOnly><AppLayout><AttendanceHistory /></AppLayout></AdminOnly>} />
      <Route path="/locations" element={<Protected><StaffOnly><AppLayout><OfficeLocations /></AppLayout></StaffOnly></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
