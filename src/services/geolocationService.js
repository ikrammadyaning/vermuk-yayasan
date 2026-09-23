import { calculateDistance } from "../utils/calculateDistance";

/**
 * geolocationService.js
 * Mengambil posisi GPS perangkat dan menghitung jarak/validasi radius.
 */

export const GEO_ERROR = {
  PERMISSION_DENIED: "PERMISSION_DENIED",
  POSITION_UNAVAILABLE: "POSITION_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  NOT_SUPPORTED: "NOT_SUPPORTED",
};

/**
 * Mengambil lokasi GPS perangkat saat ini.
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number }>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: GEO_ERROR.NOT_SUPPORTED, message: "Lokasi perangkat tidak tersedia." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject({
            code: GEO_ERROR.PERMISSION_DENIED,
            message:
              "Lokasi diperlukan untuk melakukan absensi. Silakan izinkan akses lokasi pada browser HP kamu.",
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject({
            code: GEO_ERROR.POSITION_UNAVAILABLE,
            message: "Lokasi perangkat tidak tersedia.",
          });
        } else if (error.code === error.TIMEOUT) {
          reject({
            code: GEO_ERROR.TIMEOUT,
            message: "Pengambilan lokasi terlalu lama. Pastikan GPS aktif.",
          });
        } else {
          reject({
            code: GEO_ERROR.POSITION_UNAVAILABLE,
            message: "Lokasi perangkat tidak tersedia.",
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Menghitung jarak (meter) antara dua koordinat.
 */
export { calculateDistance };

/**
 * Mengecek apakah posisi user berada dalam radius lokasi kantor.
 * @returns {{ isValid: boolean, distance: number }}
 */
export function isWithinRadius(userLat, userLon, officeLat, officeLon, radius) {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
  return {
    isValid: distance <= radius,
    distance,
  };
}
