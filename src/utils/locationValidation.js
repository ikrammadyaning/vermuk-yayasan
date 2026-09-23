import { calculateDistance } from "./calculateDistance";

/**
 * Mengecek apakah posisi user berada dalam radius lokasi kantor.
 * @param {{latitude:number, longitude:number}} userPosition
 * @param {{latitude:number, longitude:number, radius:number}} officeLocation
 * @returns {{ isValid: boolean, distance: number }}
 */
export function isWithinRadius(userPosition, officeLocation) {
  if (
    officeLocation.latitude == null ||
    officeLocation.longitude == null
  ) {
    return { isValid: false, distance: null };
  }

  const distance = calculateDistance(
    userPosition.latitude,
    userPosition.longitude,
    officeLocation.latitude,
    officeLocation.longitude
  );

  return {
    isValid: distance <= officeLocation.radius,
    distance,
  };
}
