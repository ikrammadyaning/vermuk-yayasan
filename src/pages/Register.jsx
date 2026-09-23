import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerEmployee, setCurrentEmployee } from "../services/authService";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", employeeCode: "", username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password minimal 6 karakter.");
    if (form.password !== form.confirmPassword) return setError("Konfirmasi password tidak sama.");
    try {
      const employee = await registerEmployee(form);
      setCurrentEmployee(employee);
      navigate("/register-face", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🏢</div>
        <p className="auth-eyebrow">SISTEM ABSENSI</p>
        <h1>Buat Akun Staff</h1>
        <p className="auth-subtitle">Buat akun pribadi terlebih dahulu, lalu daftarkan wajah kamu.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Nama Lengkap<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>ID Staff<input required value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} /></label>
          <label>Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label>Password<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label>Konfirmasi Password<input required type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit">LANJUT DAFTAR WAJAH</button>
        </form>
        <button type="button" className="auth-secondary" onClick={() => navigate("/login")}>Sudah punya akun? Login</button>
      </div>
    </main>
  );
}
