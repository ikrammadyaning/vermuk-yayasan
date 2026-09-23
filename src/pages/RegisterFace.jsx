import { useNavigate } from "react-router-dom";
import FaceEnrollment from "../components/FaceEnrollment";
import { getCurrentEmployee, updateFaceEnrollment } from "../services/authService";
import "./Auth.css";

export default function RegisterFace() {
  const navigate = useNavigate();
  const employee = getCurrentEmployee();

  if (!employee) {
    navigate("/login", { replace: true });
    return null;
  }

  async function handleComplete(enrollment) {
    await updateFaceEnrollment(employee.id, enrollment);
    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="auth-page auth-page--wide">
      <div className="auth-card">
        <p className="auth-eyebrow">LANGKAH TERAKHIR</p>
        <h1>Daftarkan Wajah</h1>
        <p className="auth-subtitle">Akun <strong>{employee.fullName}</strong> akan dikaitkan dengan data wajah ini untuk proses absensi.</p>
        <FaceEnrollment onComplete={handleComplete} />
      </div>
    </main>
  );
}
