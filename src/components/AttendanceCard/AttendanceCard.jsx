import StatusBadge from "../StatusBadge/StatusBadge";
import { formatDistance } from "../../utils/calculateDistance";
import "./AttendanceCard.css";

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Card untuk menampilkan satu record absensi (dipakai di Dashboard & Riwayat).
 */
export default function AttendanceCard({ record }) {
  if (!record) return null;

  return (
    <div className="attendance-card">
      <div className="attendance-card__top">
        <span className="attendance-card__date">
          {formatDate(record.timestamp)}
        </span>
        <span className="attendance-card__time">
          {formatTime(record.timestamp)}
        </span>
      </div>

      <div className="attendance-card__location">
        <span aria-hidden="true">📍</span>
        <span>{record.officeLocationName}</span>
      </div>

      <div className="attendance-card__distance">
        {formatDistance(record.distanceFromOffice)} dari kantor
      </div>

      <div className="attendance-card__footer">
        <StatusBadge variant={record.faceVerified ? "success" : "error"}>
          {record.faceVerified ? "✓ Wajah terverifikasi" : "✕ Verifikasi gagal"}
        </StatusBadge>
        <StatusBadge variant="success">✓ Absensi berhasil</StatusBadge>
      </div>
    </div>
  );
}
