import { useEffect, useRef, useState } from "react";
import { enrollFace, warmUpFaceModels } from "../services/faceVerification";
import "./FaceEnrollment.css";

export default function FaceEnrollment({ onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");

  useEffect(() => {
    warmUpFaceModels().catch(() => {}).finally(() => startCamera());
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setStatus("starting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Akses kamera diperlukan untuk mendaftarkan wajah.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function handleEnroll() {
    try {
      setStatus("capturing");
      const enrollment = await enrollFace(videoRef.current);
      stopCamera();
      onComplete(enrollment);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Gagal mendaftarkan wajah.");
    }
  }

  return (
    <div className="face-enrollment">
      <div className="face-enrollment__camera">
        {status === "error" ? (
          <div className="face-enrollment__placeholder">{error}</div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="face-enrollment__frame" />
            {status === "starting" && <div className="face-enrollment__overlay">Membuka kamera...</div>}
            {status === "capturing" && <div className="face-enrollment__overlay">Mendaftarkan wajah...</div>}
          </>
        )}
      </div>
      <p className="face-enrollment__hint">Posisikan wajah di tengah frame dan pastikan pencahayaan cukup.</p>
      {status === "error" ? (
        <button type="button" className="face-enrollment__button" onClick={startCamera}>Coba Lagi</button>
      ) : (
        <button type="button" className="face-enrollment__button" disabled={status !== "ready"} onClick={handleEnroll}>
          DAFTARKAN WAJAH
        </button>
      )}
    </div>
  );
}
