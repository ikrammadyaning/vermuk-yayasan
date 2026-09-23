/**
 * Menghitung jarak antara dua titik koordinat menggunakan formula Haversine.
 * @param {number} lat1 - Latitude titik 1 (derajat)
 * @param {number} lon1 - Longitude titik 1 (derajat)
 * @param {number} lat2 - Latitude titik 2 (derajat)
 * @param {number} lon2 - Longitude titik 2 (derajat)
 * @returns {number} jarak dalam meter
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // radius bumi dalam meter

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance; // meter
}

/**
 * Format jarak dalam meter menjadi string yang mudah dibaca.
 * Contoh: 47 -> "47 meter", 2400 -> "2.4 KM"
 */
export function formatDistance(distanceInMeters) {
  if (distanceInMeters == null || Number.isNaN(distanceInMeters)) {
    return "-";
  }
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(1)} KM`;
  }
  return `${Math.round(distanceInMeters)} meter`;
}
