import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceCard from "../components/AttendanceCard/AttendanceCard";
import { getLatestAttendance, hasAttendedToday } from "../services/attendanceService";
import { getCurrentEmployee } from "../services/authService";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [latest, setLatest] = useState(null);
  const [attendedToday, setAttendedToday] = useState(false);
  const employee = getCurrentEmployee();

  useEffect(() => {
    let active = true;
    async function load() {
      if (!employee?.id) return;
      const [latestRecord, today] = await Promise.all([getLatestAttendance(employee.id), hasAttendedToday(employee.id)]);
      if (active) { setLatest(latestRecord); setAttendedToday(today); }
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

        {attendedToday && latest ? (
          <div className="dashboard-page__status-card dashboard-page__status-card--success">
            <span className="dashboard-page__status-icon">✓</span>
            <div>
              <div className="dashboard-page__status-label">Sudah Absen</div>
              <div className="dashboard-page__status-time">
                {new Date(latest.timestamp).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {latest.officeLocationName}
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
        📍 ABSEN SEKARANG
      </button>

      {latest && (
        <section className="dashboard-page__section">
          <h2 className="dashboard-page__section-title">Absensi Terakhir</h2>
          <AttendanceCard record={latest} />
        </section>
      )}
    </div>
  );
}
