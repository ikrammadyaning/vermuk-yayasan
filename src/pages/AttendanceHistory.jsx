import { useEffect, useState } from "react";
import { getAllAttendanceHistory } from "../services/attendanceService";
import { getCurrentEmployee, isAdmin } from "../services/authService";
import "./AttendanceHistory.css";

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

function normalizeRecord(record) {
  const employee = record.employees;
  return {
    ...record,
    employeeName: record.employeeName || employee?.full_name || "Staff",
    employeeCode: record.employeeCode || employee?.employee_code || "-",
  };
}

function groupAttendanceByEmployeeAndDay(records) {
  const grouped = {};

  for (const record of records) {
    const employeeId = record.employeeId || record.employee_id;
    if (!employeeId) continue;

    const date = new Date(record.timestamp).toDateString();
    const key = `${employeeId}-${date}`;

    if (!grouped[key]) {
      grouped[key] = {
        employeeId,
        employeeName: record.employeeName,
        employeeCode: record.employeeCode,
        date,
        checkIn: null,
        checkOut: null,
        location: record.officeLocationName,
      };
    }

    if (record.type === "check-in" && !grouped[key].checkIn) {
      grouped[key].checkIn = record;
    } else if (record.type === "check-out") {
      grouped[key].checkOut = record;
    }
  }

  return Object.values(grouped);
}

export default function AttendanceHistory() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const admin = isAdmin(getCurrentEmployee());

  useEffect(() => {
    let active = true;
    if (!admin) return undefined;
    getAllAttendanceHistory()
      .then((records) => {
        if (!active) return;
        const normalized = records.map(normalizeRecord);
        const grouped = groupAttendanceByEmployeeAndDay(normalized);
        setHistory(grouped);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => { active = false; };
  }, [admin]);

  if (!admin) return null;

  return (
    <div className="history-page">
      <div className="history-page__header">
        <div>
          <p className="history-page__eyebrow">ADMINISTRATOR</p>
          <h1 className="history-page__title">Riwayat Absensi Staff</h1>
          <p className="history-page__subtitle">Daftar staff yang sudah melakukan absensi.</p>
        </div>
        <div className="history-page__count">{history.length} hari</div>
      </div>

      {error && <div className="history-page__error">{error}</div>}

      {history.length === 0 ? (
        <div className="history-page__empty">
          <span className="history-page__empty-icon">🕐</span>
          <p>Belum ada staff yang melakukan absensi.</p>
        </div>
      ) : (
        <div className="history-page__list">
          {history.map((group, index) => (
            <div className="admin-history-record" key={index}>
              <div className="admin-history-record__staff">
                <strong>{group.employeeName}</strong>
                <span>ID Staff: {group.employeeCode}</span>
              </div>
              <div className="admin-history-record__attendance">
                <div className="attendance-card">
                  <div className="attendance-card__top">
                    <span className="attendance-card__date">{formatDate(group.date)}</span>
                    <span className="attendance-card__status">
                      {group.checkOut ? "Selesai" : "Belum Check-out"}
                    </span>
                  </div>

                  <div className="attendance-card__location">
                    <span aria-hidden="true">📍</span>
                    <span>{group.location}</span>
                  </div>

                  <div className="attendance-card__times">
                    {group.checkIn && (
                      <div className="attendance-card__time-row">
                        <span>Check-in:</span>
                        <strong>{formatTimeWIB(group.checkIn.timestamp)}</strong>
                      </div>
                    )}
                    {group.checkOut && (
                      <div className="attendance-card__time-row">
                        <span>Check-out:</span>
                        <strong>{formatTimeWIB(group.checkOut.timestamp)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="attendance-card__footer">
                    {group.checkIn && (
                      <span className="attendance-card__badge">
                        {group.checkIn.faceVerified ? "✓ Wajah terverifikasi" : "✕ Verifikasi gagal"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
