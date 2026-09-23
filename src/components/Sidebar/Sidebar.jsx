import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentEmployee, isAdmin, logoutEmployee } from "../../services/authService";
import "./Sidebar.css";

const COMPANY_NAME = "NAMA PERUSAHAAN";

const STAFF_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/attendance", label: "Absensi", icon: "📍" },
  { to: "/locations", label: "Lokasi", icon: "🏢" },
];

const ADMIN_NAV_ITEMS = [
  { to: "/history", label: "Riwayat Absensi", icon: "🕐" },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const employee = getCurrentEmployee();
  const admin = isAdmin(employee);
  const navItems = admin ? ADMIN_NAV_ITEMS : STAFF_NAV_ITEMS;

  function handleLogout() {
    logoutEmployee();
    onClose();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`} aria-label="Navigasi utama">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <img src="/assets/logo-placeholder.png" alt="Logo" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }} />
            <div className="sidebar__logo-fallback">🏢</div>
          </div>
          <div>
            <span className="sidebar__company">{COMPANY_NAME}</span>
            <small className="sidebar__staff-name">{employee?.fullName}</small>
            {admin && <small className="sidebar__role">Administrator</small>}
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}>
              <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar__logout-btn" onClick={handleLogout}>Keluar</button>
        <button type="button" className="sidebar__close-btn" onClick={onClose}>Tutup</button>
      </aside>
    </>
  );
}
