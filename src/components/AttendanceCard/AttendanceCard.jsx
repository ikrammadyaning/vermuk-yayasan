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

function formatTimeWIB(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Card untuk menampilkan satu record absensi (dipakai di Dashboard & Riwayat).
 */
export default function AttendanceCard({ record }) {
  if (!record) return null;

  const getStatusText = () => {
    if (record.type === "check-out") {
      return "Selesai";
    } else if (record.type === "check-in") {
      return "Belum Check-out";
    }
    return "✓ Absensi berhasil";
  };

  const getStatusVariant = () => {
    if (record.type === "check-out") {
      return "success";
    } else if (record.type === "check-in") {
      return "warning";
    }
    return "success";
  };

  return (
    <div className="attendance-card">
      <div className="attendance-card__top">
        <span className="attendance-card__date">
          {formatDate(record.timestamp)}
        </span>
        <span className="attendance-card__time">
          {formatTimeWIB(record.timestamp)}
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
        <StatusBadge variant={getStatusVariant()}>
          {getStatusText()}
        </StatusBadge>
      </div>
    </div>
  );
}
