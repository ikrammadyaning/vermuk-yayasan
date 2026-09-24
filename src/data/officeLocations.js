// Data awal lokasi kantor.
// PENTING: Jangan mengganti link Google Maps lokasi yang sudah ditentukan.
// Struktur ini nantinya akan digantikan oleh tabel `office_locations` di Supabase.

export const officeLocations = [
  {
    id: 1,
    name: "Head Office",
    googleMapsUrl: "https://maps.app.goo.gl/DFdr8X54oSdELrBa8",
    latitude: -6.296565590898558,
    longitude: 106.97356988878227,
    radius: 100,
    status: "active",
  },
  {
    id: 2,
    name: "KMKC 1",
    googleMapsUrl: "https://maps.app.goo.gl/z28WrqsyiQtKhQDH8",
    latitude: -6.3002545853050504,
    longitude: 106.96961107216039,
    radius: 100,
    status: "active",
  },
  {
    id: 3,
    name: "KMKC 2",
    googleMapsUrl: "https://maps.app.goo.gl/jZ7hoAx5iSA4ZLWD9?g_st=awb",
    latitude: -6.299806695486294,
    longitude: 106.96989002208893,
    radius: 100,
    status: "active",
  },
  {
    id: 4,
    name: "Cabang 3",
    googleMapsUrl: "https://maps.app.goo.gl/CcWqy7C9WM1ne87r5",
    latitude: -6.968049250794925,
    longitude: 106.78555693686727,
    radius: 1000000000,
    status: "active",
  },
];

// const STORAGE_KEY = "attendance_office_locations";

/**
 * Mengambil daftar lokasi kantor dari localStorage.
 * Jika belum ada, gunakan data awal (officeLocations) sebagai seed.
 * TODO (Supabase): ganti dengan `supabase.from('office_locations').select('*')`
 */
export function getOfficeLocations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(officeLocations));
      return officeLocations;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gagal membaca data lokasi kantor:", err);
    return officeLocations;
  }
}

/**
 * Menyimpan koordinat hasil resolve Google Maps URL ke localStorage,
 * supaya tidak perlu resolve ulang setiap kali.
 * TODO (Supabase): ganti dengan `supabase.from('office_locations').update(...)`
 */
export function updateOfficeLocationCoordinates(id, latitude, longitude) {
  const locations = getOfficeLocations();
  const updated = locations.map((loc) =>
    loc.id === id ? { ...loc, latitude, longitude } : loc
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getOfficeLocationById(id) {
  return getOfficeLocations().find((loc) => loc.id === Number(id));
}
