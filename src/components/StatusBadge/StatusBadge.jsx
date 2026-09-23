import "./StatusBadge.css";

/**
 * Badge status kecil untuk menampilkan status seperti "Active", "Berhasil", dll.
 * variant: 'success' | 'error' | 'neutral' | 'accent'
 */
export default function StatusBadge({ children, variant = "neutral" }) {
  return <span className={`status-badge status-badge--${variant}`}>{children}</span>;
}
