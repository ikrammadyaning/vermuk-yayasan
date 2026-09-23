import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator/StepIndicator";
import LocationSelector from "../components/LocationSelector/LocationSelector";
import LocationValidator from "../components/LocationValidator/LocationValidator";
import FaceVerification from "../components/FaceVerification/FaceVerification";
import { getOfficeLocations } from "../data/officeLocations";
import { useGeolocation } from "../hooks/useGeolocation";
import { isWithinRadius } from "../utils/locationValidation";
import { saveAttendance } from "../services/attendanceService";
import { formatDistance } from "../utils/calculateDistance";
import { getCurrentEmployee } from "../services/authService";
import "./Attendance.css";

const STEPS = {
  LOCATION: 0,
  GPS: 1,
  FACE: 2,
  DONE: 3,
};

export default function Attendance() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.LOCATION);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [successRecord, setSuccessRecord] = useState(null);
  const employee = getCurrentEmployee();

  const { location, status: geoStatus, error: geoError, requestLocation, reset: resetGeo } =
    useGeolocation();

  // Dihitung langsung saat render (bukan lewat effect) begitu GPS berhasil didapat.
  const validationResult =
    geoStatus === "success" && location && selectedLocation
      ? isWithinRadius(location, selectedLocation)
      : null;

  useEffect(() => {
    setLocations(getOfficeLocations());
  }, []);

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
      alert('Wajah tidak cocok. Absensi dibatalkan.');
      navigate('/dashboard');
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
    setCurrentStep(STEPS.DONE);
  }

  const coordinatesUnavailable =
    selectedLocation != null &&
    (selectedLocation.latitude == null || selectedLocation.longitude == null);

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
