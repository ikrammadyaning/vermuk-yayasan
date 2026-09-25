import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceCard from "../components/AttendanceCard/AttendanceCard";
import { getTodayCheckIn, getTodayCheckOut, hasAttendedToday } from "../services/attendanceService";
import { getCurrentEmployee } from "../services/authService";
import "./Dashboard.css";

function formatTimeWIB(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const employee = getCurrentEmployee();

  useEffect(() => {
    let active = true;
    async function load() {
      if (!employee?.id) return;
      const [todayIn, todayOut] = await Promise.all([
        getTodayCheckIn(employee.id),
        getTodayCheckOut(employee.id),
      ]);
      if (active) {
        setCheckIn(todayIn);
        setCheckOut(todayOut);
      }
    }
    load();
    return () => { active = false; };
  }, [employee?.id]);

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__greeting">
        Selamat datang,
        <br />
        {employee?.fullName}
      </h1>

      <section className="dashboard-page__section">
        <h2 className="dashboard-page__section-title">Status Hari Ini</h2>

        {checkIn ? (
          <div className={`dashboard-page__status-card ${checkOut ? "dashboard-page__status-card--success" : ""}`}>
            <span className="dashboard-page__status-icon">✓</span>
            <div>
              <div className="dashboard-page__status-label">
                {checkOut ? "Selesai" : "Sudah Absen Masuk"}
              </div>
              <div className="dashboard-page__status-time">
                {formatTimeWIB(checkIn.timestamp)}
                {checkOut && ` - ${formatTimeWIB(checkOut.timestamp)}`}
                {" "} · {checkIn.officeLocationName}
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-page__status-card">
            <span className="dashboard-page__status-icon" aria-hidden="true">
              ○
            </span>
            <div>
              <div className="dashboard-page__status-label">Belum Absen</div>
              <div className="dashboard-page__status-time">
                Yuk lakukan absensi sekarang
              </div>
            </div>
          </div>
        )}
      </section>

      <button
        type="button"
        className="dashboard-page__cta"
        onClick={() => navigate("/attendance")}
      >
        📍 {checkIn && !checkOut ? "ABSEN KELUAR" : "ABSEN SEKARANG"}
      </button>

      {checkIn && (
        <section className="dashboard-page__section">
          <h2 className="dashboard-page__section-title">Absensi Terakhir</h2>
          <AttendanceCard record={checkOut || checkIn} />
        </section>
      )}
    </div>
  );
}
