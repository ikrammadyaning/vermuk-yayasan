import { useEffect, useRef, useState } from "react";
import { verifyFace } from "../../services/faceVerification";
import "./FaceVerification.css";

/**
 * Komponen verifikasi wajah menggunakan kamera depan HP.
 * status: 'starting' | 'ready' | 'verifying' | 'success' | 'error' | 'camera-denied'
 */
export default function FaceVerification({ employee, onSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("starting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("ready");
    } catch {
      setStatus("camera-denied");
      setErrorMessage("Akses kamera diperlukan untuk verifikasi wajah.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function handleVerify() {
    setStatus("verifying");
    try {
      const result = await verifyFace({
        enrolledFace: employee?.faceDescriptor,
        videoElement: videoRef.current,
      });
      if (result.success) {
        setStatus("success");
        stopCamera();
        setTimeout(() => onSuccess(result), 500);
      } else {
        setStatus("error");
        setErrorMessage(result.reason === "mismatch" ? "Wajah tidak cocok dengan akun ini." : "Wajah tidak terverifikasi. Silakan coba lagi.");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(error?.message || "Verifikasi wajah gagal. Silakan coba lagi.");
    }
  }

  function handleRetryCamera() {
    startCamera();
  }

  function handleRetryVerify() {
    setStatus("ready");
    setErrorMessage("");
  }

  return (
    <div className="face-verification">
      <span className="face-verification__mock-label">Wajah terdaftar • {employee?.fullName}</span>

      <h2 className="face-verification__title">Verifikasi Wajah</h2>

      <div className="face-verification__frame-wrapper">
        {status === "camera-denied" ? (
          <div className="face-verification__placeholder">
            <span className="face-verification__placeholder-icon">🚫</span>
            <p>{errorMessage}</p>
          </div>
        ) : (
          <div className="face-verification__camera-box">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="face-verification__video"
            />
            <div className="face-verification__face-frame" />
            {status === "starting" && (
              <div className="face-verification__overlay">
                <div className="face-verification__spinner" />
                <span>Membuka kamera...</span>
              </div>
            )}
            {status === "verifying" && (
              <div className="face-verification__overlay">
                <div className="face-verification__spinner" />
                <span>Memverifikasi wajah...</span>
              </div>
            )}
            {status === "success" && (
              <div className="face-verification__overlay face-verification__overlay--success">
                <span className="face-verification__check">✓</span>
              </div>
            )}
          </div>
        )}
      </div>

      {(status === "ready" || status === "error") && (
        <p className="face-verification__hint">
          Posisikan wajah kamu di dalam frame
        </p>
      )}

      {status === "error" && (
        <p className="face-verification__error-text">{errorMessage}</p>
      )}

      <div className="face-verification__actions">
        {status === "camera-denied" && (
          <button
            type="button"
            className="face-verification__btn"
            onClick={handleRetryCamera}
          >
            Coba Lagi
          </button>
        )}

        {status === "ready" && (
          <button
            type="button"
            className="face-verification__btn"
            onClick={handleVerify}
          >
            VERIFIKASI
          </button>
        )}

        {status === "error" && (
          <button
            type="button"
            className="face-verification__btn"
            onClick={handleRetryVerify}
          >
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}
