import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator/StepIndicator";
import LocationSelector from "../components/LocationSelector/LocationSelector";
import LocationValidator from "../components/LocationValidator/LocationValidator";
import FaceVerification from "../components/FaceVerification/FaceVerification";
import { getOfficeLocations } from "../data/officeLocations";
import { useGeolocation } from "../hooks/useGeolocation";
import { isWithinRadius } from "../utils/locationValidation";
import { saveAttendance, getTodayCheckIn, getTodayCheckOut, checkOut } from "../services/attendanceService";
import { formatDistance } from "../utils/calculateDistance";
import { getCurrentEmployee } from "../services/authService";
import "./Attendance.css";

const STEPS = {
  LOCATION: 0,
  GPS: 1,
  FACE: 2,
  DONE: 3,
};

const WORK_HOURS_MS = 9 * 60 * 60 * 1000;

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatTimeWIB(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Attendance() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.LOCATION);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [successRecord, setSuccessRecord] = useState(null);
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [todayCheckOut, setTodayCheckOut] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const employee = getCurrentEmployee();

  const { location, status: geoStatus, error: geoError, requestLocation, reset: resetGeo } =
    useGeolocation();

  const validationResult =
    geoStatus === "success" && location && selectedLocation
      ? isWithinRadius(location, selectedLocation)
      : null;

  useEffect(() => {
    setLocations(getOfficeLocations());
  }, []);

  useEffect(() => {
    let active = true;
    async function loadTodayStatus() {
      if (!employee?.id) return;
      setLoading(true);
      try {
        const [checkIn, checkOutRecord] = await Promise.all([
          getTodayCheckIn(employee.id),
          getTodayCheckOut(employee.id),
        ]);
        if (active) {
          setTodayCheckIn(checkIn);
          setTodayCheckOut(checkOutRecord);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    loadTodayStatus();
    return () => { active = false; };
  }, [employee?.id]);

  useEffect(() => {
    if (!todayCheckIn || todayCheckOut) return;

    const checkInTime = new Date(todayCheckIn.timestamp).getTime();
    const minCheckOutTime = checkInTime + WORK_HOURS_MS;

    function updateCountdown() {
      const now = Date.now();
      const remaining = minCheckOutTime - now;
      setCountdown(remaining);
      setCanCheckOut(remaining <= 0);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [todayCheckIn, todayCheckOut]);

  function handleSelectLocation(loc) {
    setSelectedLocation(loc);
    resetGeo();
    setCurrentStep(STEPS.GPS);
  }

  function handleCheckLocation() {
    requestLocation();
  }

  function handleRetryLocation() {
    resetGeo();
  }

  function handleContinueToFace() {
    setCurrentStep(STEPS.FACE);
  }

  async function handleFaceSuccess(faceResult) {
    if (!faceResult?.success) {
      alert("Wajah tidak cocok. Absensi dibatalkan.");
      navigate("/dashboard");
      return;
    }

    const record = await saveAttendance({
      employeeId: employee.id,
      employeeName: employee.fullName,
      officeLocationId: selectedLocation.id,
      officeLocationName: selectedLocation.name,
      latitude: location?.latitude,
      longitude: location?.longitude,
      distanceFromOffice: validationResult?.distance,
      faceVerified: faceResult.success,
      timestamp: new Date().toISOString(),
      type: "check-in",
    });
    setSuccessRecord(record);
    setTodayCheckIn(record);
    setCurrentStep(STEPS.DONE);
  }

  const handleCheckOut = useCallback(async () => {
    if (!todayCheckIn || !canCheckOut) return;

    setError("");

    try {
      const record = await checkOut({
        employeeId: employee.id,
        checkInId: todayCheckIn.id,
        officeLocationId: todayCheckIn.officeLocationId,
        latitude: location?.latitude || todayCheckIn.latitude,
        longitude: location?.longitude || todayCheckIn.longitude,
        distanceFromOffice: todayCheckIn.distanceFromOffice,
        faceVerified: todayCheckIn.faceVerified,
      });

      if (record) {
        setTodayCheckOut(record);
        setSuccessRecord(record);
      } else {
        setError("Gagal menyimpan check-out. Silakan coba lagi.");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat check-out.");
    }
  }, [todayCheckIn, canCheckOut, employee, location]);

  const coordinatesUnavailable =
    selectedLocation != null &&
    (selectedLocation.latitude == null || selectedLocation.longitude == null);

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-page__loading">Memuat status absensi...</div>
      </div>
    );
  }

  if (todayCheckOut) {
    return (
      <div className="attendance-page">
        <div className="attendance-page__success">
          <div className="attendance-page__success-icon">✓</div>
          <h2 className="attendance-page__success-title">ABSENSI HARI INI SELESAI</h2>
          <p className="attendance-page__success-subtitle">
            {employee?.fullName}
          </p>

          <div className="attendance-page__success-card">
            <div className="attendance-page__success-row">
              <span>Check-in</span>
              <strong>{formatTimeWIB(todayCheckIn.timestamp)}</strong>
            </div>
            <div className="attendance-page__success-row">
              <span>Check-out</span>
              <strong>{formatTimeWIB(todayCheckOut.timestamp)}</strong>
            </div>
            <div className="attendance-page__success-row">
              <span>Lokasi</span>
              <strong>{todayCheckIn.officeLocationName}</strong>
            </div>
          </div>

          <button
            type="button"
            className="attendance-page__success-btn"
            onClick={() => navigate("/dashboard")}
          >
            KEMBALI KE DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  if (todayCheckIn && currentStep !== STEPS.DONE) {
    const checkInTime = new Date(todayCheckIn.timestamp).getTime();
    const minCheckOutTime = new Date(checkInTime + WORK_HOURS_MS);

    return (
      <div className="attendance-page">
        <div className="attendance-page__checkin-status">
          <div className="attendance-page__checkin-icon">✓</div>
          <h2 className="attendance-page__checkin-title">SUDAH ABSEN MASUK</h2>

          <div className="attendance-page__checkin-card">
            <div className="attendance-page__checkin-row">
              <span>Waktu Check-in</span>
              <strong>{formatTimeWIB(todayCheckIn.timestamp)}</strong>
            </div>
            <div className="attendance-page__checkin-row">
              <span>Check-out Tersedia</span>
              <strong>{formatTimeWIB(minCheckOutTime.toISOString())}</strong>
            </div>
            <div className="attendance-page__checkin-row">
              <span>Lokasi</span>
              <strong>{todayCheckIn.officeLocationName}</strong>
            </div>
          </div>

          {error && <div className="attendance-page__error">{error}</div>}

          {!canCheckOut && (
            <div className="attendance-page__countdown">
              <span className="attendance-page__countdown-label">
                Check-out tersedia dalam
              </span>
              <span className="attendance-page__countdown-time">
                {formatCountdown(countdown)}
              </span>
            </div>
          )}

          {canCheckOut && (
            <div className="attendance-page__checkout-available">
              <span>Anda sudah dapat melakukan check-out</span>
            </div>
          )}

          <button
            type="button"
            className="attendance-page__checkout-btn"
            disabled={!canCheckOut}
            onClick={handleCheckOut}
          >
            ABSEN KELUAR
          </button>

          <button
            type="button"
            className="attendance-page__back-btn"
            onClick={() => navigate("/dashboard")}
          >
            KEMBALI KE DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <StepIndicator currentStep={currentStep} />

      {currentStep === STEPS.LOCATION && (
        <LocationSelector locations={locations} onSelect={handleSelectLocation} />
      )}

      {currentStep === STEPS.GPS && selectedLocation && (
        <LocationValidator
          selectedLocation={selectedLocation}
          status={geoStatus}
          distance={validationResult?.distance}
          isWithinRadius={validationResult?.isValid}
          errorMessage={geoError?.message}
          coordinatesUnavailable={coordinatesUnavailable}
          onCheckLocation={handleCheckLocation}
          onContinue={handleContinueToFace}
          onRetry={handleRetryLocation}
        />
      )}

      {currentStep === STEPS.FACE && (
        <FaceVerification employee={employee} onSuccess={handleFaceSuccess} />
      )}

      {currentStep === STEPS.DONE && successRecord && (
        <div className="attendance-page__success">
          <div className="attendance-page__success-icon">✓</div>
          <h2 className="attendance-page__success-title">ABSENSI BERHASIL</h2>
          <p className="attendance-page__success-subtitle">
            Selamat, {successRecord.employeeName}!
          </p>

          <div className="attendance-page__success-card">
            <div className="attendance-page__success-row">
              <span>Lokasi</span>
              <strong>{successRecord.officeLocationName}</strong>
            </div>
            <div className="attendance-page__success-row">
              <span>Jarak</span>
              <strong>{formatDistance(successRecord.distanceFromOffice)}</strong>
            </div>
            <div className="attendance-page__success-row">
              <span>Waktu</span>
              <strong>
                {new Date(successRecord.timestamp).toLocaleTimeString("id-ID")}
              </strong>
            </div>
            <div className="attendance-page__success-row">
              <span>Verifikasi wajah</span>
              <strong>Berhasil</strong>
            </div>
          </div>

          <button
            type="button"
            className="attendance-page__success-btn"
            onClick={() => navigate("/dashboard")}
          >
            KEMBALI KE DASHBOARD
          </button>
        </div>
      )}
    </div>
  );
}
