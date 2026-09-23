import { useCallback, useState } from "react";
import { getCurrentLocation } from "../services/geolocationService";

/**
 * Hook untuk mengambil lokasi GPS perangkat dengan state loading/error.
 *
 * @returns {{
 *   location: {latitude:number, longitude:number, accuracy:number} | null,
 *   status: 'idle' | 'loading' | 'success' | 'error',
 *   error: { code: string, message: string } | null,
 *   requestLocation: () => Promise<void>,
 *   reset: () => void,
 * }}
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const requestLocation = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const position = await getCurrentLocation();
      setLocation(position);
      setStatus("success");
    } catch (err) {
      setError(err);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setLocation(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { location, status, error, requestLocation, reset };
}
