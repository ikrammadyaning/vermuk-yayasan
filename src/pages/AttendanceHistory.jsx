import { useEffect, useState } from "react";
import AttendanceCard from "../components/AttendanceCard/AttendanceCard";
import { getAllAttendanceHistory } from "../services/attendanceService";
import { getCurrentEmployee, isAdmin } from "../services/authService";
import "./AttendanceHistory.css";

function normalizeRecord(record) {
  const employee = record.employees;
  return {
    ...record,
    employeeName: record.employeeName || employee?.full_name || "Staff",
    employeeCode: record.employeeCode || employee?.employee_code || "-",
  };
}

export default function AttendanceHistory() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const admin = isAdmin(getCurrentEmployee());

  useEffect(() => {
    let active = true;
    if (!admin) return undefined;
    getAllAttendanceHistory()
      .then((records) => { if (active) setHistory(records.map(normalizeRecord)); })
      .catch((err) => { if (active) setError(err.message); });
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
        <div className="history-page__count">{history.length} absensi</div>
      </div>

      {error && <div className="history-page__error">{error}</div>}

      {history.length === 0 ? (
        <div className="history-page__empty">
          <span className="history-page__empty-icon">🕐</span>
          <p>Belum ada staff yang melakukan absensi.</p>
        </div>
      ) : (
        <div className="history-page__list">
          {history.map((record) => (
            <div className="admin-history-record" key={record.id}>
              <div className="admin-history-record__staff">
                <strong>{record.employeeName}</strong>
                <span>ID Staff: {record.employeeCode}</span>
              </div>
              <AttendanceCard record={record} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
