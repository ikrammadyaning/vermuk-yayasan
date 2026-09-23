import "./Header.css";

// TODO: Replace with client's company name
const COMPANY_NAME = "LPK Karisma Melati Sedayu Group";

/**
 * Header sederhana. Di mobile menampilkan tombol hamburger untuk membuka
 * sidebar drawer.
 */
export default function Header({ onMenuClick }) {
  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__menu-btn"
        onClick={onMenuClick}
        aria-label="Buka menu navigasi"
      >
        ☰
      </button>

      <div className="app-header__brand">
        <div className="app-header__logo">
          {/* TODO: Replace with client's logo */}
          <img
            src="/assets/logo-placeholder.png"
            alt="Logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div className="app-header__logo-fallback">🏢</div>
        </div>
        <span className="app-header__company">{COMPANY_NAME}</span>
      </div>
    </header>
  );
}
