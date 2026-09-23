import { formatDistance } from "../../utils/calculateDistance";
import "./LocationValidator.css";

/**
 * Menampilkan UI untuk step verifikasi GPS: lokasi terpilih, tombol
 * "Periksa Lokasi", hasil validasi (dalam/luar radius), dan error handling.
 *
 * status: 'idle' | 'loading' | 'success' | 'error'
 */
export default function LocationValidator({
  selectedLocation,
  status,
  distance,
  isWithinRadius,
  errorMessage,
  coordinatesUnavailable,
  onCheckLocation,
  onContinue,
  onRetry,
}) {
  return (
    <div className="location-validator">
      <div className="location-validator__selected">
        <span className="location-validator__label">Lokasi absensi kamu</span>
        <div className="location-validator__name">
          📍 {selectedLocation.name}
        </div>
      </div>

      {status === "idle" && !coordinatesUnavailable && (
        <button
          type="button"
          className="location-validator__btn location-validator__btn--primary"
          onClick={onCheckLocation}
        >
          📍 PERIKSA LOKASI
        </button>
      )}

      {coordinatesUnavailable && (
        <div className="location-validator__notice">
          Koordinat lokasi belum tersedia. Hubungi admin untuk melengkapi data
          koordinat lokasi ini terlebih dahulu.
        </div>
      )}

      {status === "loading" && (
        <div className="location-validator__loading">
          <div className="location-validator__spinner" />
          <span>Mengambil lokasi kamu...</span>
        </div>
      )}

      {status === "error" && (
        <div className="location-validator__result location-validator__result--error">
          <p>{errorMessage}</p>
          <button
            type="button"
            className="location-validator__btn location-validator__btn--primary"
            onClick={onRetry}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {status === "success" && isWithinRadius && (
        <div className="location-validator__result location-validator__result--success">
          <div className="location-validator__distance-row">
            <span>Jarak kamu</span>
            <strong>{formatDistance(distance)} dari kantor</strong>
          </div>
          <div className="location-validator__radius-row">
            <span>Radius</span>
            <span>{selectedLocation.radius} meter</span>
          </div>
          <div className="location-validator__status location-validator__status--success">
            ✓ LOKASI VALID
          </div>
          <button
            type="button"
            className="location-validator__btn location-validator__btn--primary"
            onClick={onContinue}
          >
            LANJUT VERIFIKASI WAJAH
          </button>
        </div>
      )}

      {status === "success" && !isWithinRadius && (
        <div className="location-validator__result location-validator__result--error">
          <div className="location-validator__distance-row">
            <span>Jarak kamu</span>
            <strong>{formatDistance(distance)}</strong>
          </div>
          <div className="location-validator__radius-row">
            <span>Radius</span>
            <span>{selectedLocation.radius} meter</span>
          </div>
          <div className="location-validator__status location-validator__status--error">
            ✕ DI LUAR AREA ABSENSI
          </div>
          <button
            type="button"
            className="location-validator__btn location-validator__btn--secondary"
            onClick={onRetry}
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}
