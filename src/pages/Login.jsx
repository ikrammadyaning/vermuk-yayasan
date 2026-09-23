import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin, loginEmployee } from "../services/authService";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const employee = await loginEmployee(form.username, form.password);
      if (isAdmin(employee)) {
        navigate("/history", { replace: true });
        return;
      }
      navigate(employee.faceEnrolled && employee.faceDescriptor ? "/dashboard" : "/register-face", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="public/assets/logo-placeholder.png" alt="" /></div>
        <p className="auth-eyebrow">SISTEM ABSENSI</p>
        <h1>Login</h1>
        <p className="auth-subtitle">Staff masuk untuk melakukan absensi. Admin masuk untuk melihat riwayat absensi seluruh staff.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label>Password<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit">LOGIN</button>
        </form>
        <button type="button" className="auth-secondary" onClick={() => navigate("/register")}>Belum punya akun staff? Buat akun</button>
      </div>
    </main>
  );
}
