/**
 * googleMapsService.js
 * ---------------------------------------------------------------------------
 * Service modular untuk mengubah Google Maps URL menjadi koordinat
 * (latitude, longitude).
 *
 * CATATAN PENTING (PROTOTYPE):
 * Google Maps short link (https://maps.app.goo.gl/...) adalah URL yang
 * di-redirect oleh server Google. Untuk membaca URL hasil redirect dan
 * mengambil koordinat di dalamnya, dibutuhkan request ke server (backend),
 * karena browser tidak diizinkan (CORS) untuk membaca redirect lintas
 * domain semacam ini secara langsung dari client-side murni.
 *
 * Karena prototype ini TIDAK menggunakan backend, fungsi di bawah ini
 * TIDAK memalsukan koordinat. Jika koordinat belum bisa diperoleh secara
 * otomatis, sistem akan menampilkan status:
 *   "Koordinat lokasi belum tersedia."
 *
 * PRODUCTION / TAHAP SELANJUTNYA:
 * Ganti isi `resolveGoogleMapsUrl()` dengan salah satu opsi berikut:
 *   1. Backend endpoint sendiri (Node.js/Supabase Edge Function) yang
 *      melakukan fetch ke googleMapsUrl, mengikuti redirect, lalu
 *      mem-parsing koordinat dari final URL (biasanya mengandung pola
 *      "@lat,lng,zoom" atau parameter "q=lat,lng").
 *   2. Google Maps Geocoding API / Places API resmi.
 *   3. Menyimpan latitude & longitude secara manual di admin panel setelah
 *      admin membuka link tersebut sekali dan menyalin koordinatnya
 *      (workaround manual paling sederhana untuk tahap awal produksi).
 *
 * Setelah koordinat berhasil diperoleh (dengan cara apa pun), simpan hasilnya
 * ke object lokasi melalui `updateOfficeLocationCoordinates()` di
 * `src/data/officeLocations.js`.
 * ---------------------------------------------------------------------------
 */

/**
 * Mencoba mengekstrak koordinat langsung dari sebuah URL Google Maps
 * (berlaku untuk URL panjang yang sudah mengandung "@lat,lng", bukan
 * short link "maps.app.goo.gl").
 *
 * @param {string} url
 * @returns {{ latitude: number, longitude: number } | null}
 */
export function extractCoordinatesFromGoogleMapsUrl(url) {
  if (!url || typeof url !== "string") return null;

  // Pola 1: .../@-6.1234567,106.1234567,17z...
  const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const atMatch = url.match(atPattern);
  if (atMatch) {
    return {
      latitude: parseFloat(atMatch[1]),
      longitude: parseFloat(atMatch[2]),
    };
  }

  // Pola 2: ...?q=-6.1234567,106.1234567
  const qPattern = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const qMatch = url.match(qPattern);
  if (qMatch) {
    return {
      latitude: parseFloat(qMatch[1]),
      longitude: parseFloat(qMatch[2]),
    };
  }

  // Pola 3: ...!3d-6.1234567!4d106.1234567 (format embed Google Maps)
  const dPattern = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
  const dMatch = url.match(dPattern);
  if (dMatch) {
    return {
      latitude: parseFloat(dMatch[1]),
      longitude: parseFloat(dMatch[2]),
    };
  }

  return null;
}

/**
 * Mengecek apakah sebuah URL adalah short link Google Maps
 * (maps.app.goo.gl atau goo.gl/maps) yang butuh proses redirect resolution.
 */
function isShortLink(url) {
  return /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url);
}

/**
 * Fungsi utama untuk "resolve" Google Maps URL menjadi koordinat.
 * Prototype ini TIDAK melakukan fetch ke short link (butuh backend/CORS
 * proxy), sehingga untuk short link, fungsi ini akan mengembalikan
 * status "unresolved" dan TIDAK membuat koordinat palsu.
 *
 * @param {string} googleMapsUrl
 * @returns {Promise<{ status: 'resolved' | 'unresolved', latitude: number|null, longitude: number|null, message: string }>}
 */
export async function resolveGoogleMapsUrl(googleMapsUrl) {
  if (!googleMapsUrl) {
    return {
      status: "unresolved",
      latitude: null,
      longitude: null,
      message: "Koordinat lokasi belum tersedia.",
    };
  }

  // Jika URL sudah mengandung koordinat eksplisit, langsung pakai.
  const directCoords = extractCoordinatesFromGoogleMapsUrl(googleMapsUrl);
  if (directCoords) {
    return {
      status: "resolved",
      latitude: directCoords.latitude,
      longitude: directCoords.longitude,
      message: "Koordinat berhasil diperoleh dari URL.",
    };
  }

  if (isShortLink(googleMapsUrl)) {
    // TODO (Production): panggil backend/Supabase Edge Function di sini,
    // misalnya:
    //   const res = await fetch(`/api/resolve-maps-url?url=${encodeURIComponent(googleMapsUrl)}`);
    //   const data = await res.json();
    //   return { status: 'resolved', latitude: data.latitude, longitude: data.longitude, ... };
    return {
      status: "unresolved",
      latitude: null,
      longitude: null,
      message: "Koordinat lokasi belum tersedia.",
    };
  }

  return {
    status: "unresolved",
    latitude: null,
    longitude: null,
    message: "Koordinat lokasi belum tersedia.",
  };
}
