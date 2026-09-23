import { insertAttendance, isRemoteDatabaseEnabled, selectAllAttendance, selectAttendance } from "./database";

const STORAGE_KEY = "attendance_records";

export async function saveAttendance(record) {
  if (isRemoteDatabaseEnabled) {
    const row = await insertAttendance({
      employee_id: record.employeeId,
      office_location_id: record.officeLocationId,
      latitude: record.latitude,
      longitude: record.longitude,
      distance_from_office: record.distanceFromOffice,
      face_verified: record.faceVerified ?? false,
      timestamp: record.timestamp ?? new Date().toISOString(),
      type: record.type ?? "check-in",
    });
    return { ...record, id: row?.id, timestamp: row?.timestamp ?? record.timestamp };
  }

  const records = getAllAttendance();
  const newRecord = { ...record, id: records.length ? Math.max(...records.map((r) => r.id)) + 1 : 1, timestamp: record.timestamp ?? new Date().toISOString(), type: record.type ?? "check-in" };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newRecord, ...records]));
  return newRecord;
}

export function getAllAttendance() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }

function mapRecord(r) {
  return {
    id: r.id,
    employeeId: r.employee_id ?? r.employeeId,
    employeeName: r.employee_name ?? r.employeeName ?? r.employees?.full_name ?? null,
    employeeCode: r.employee_code ?? r.employeeCode ?? r.employees?.employee_code ?? null,
    officeLocationId: r.office_location_id ?? r.officeLocationId,
    officeLocationName: r.office_location_name ?? r.officeLocationName ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
    distanceFromOffice: r.distance_from_office ?? r.distanceFromOffice,
    faceVerified: r.face_verified ?? r.faceVerified,
    timestamp: r.timestamp,
    type: r.type,
  };
}

export async function getAttendanceHistory(employeeId) {
  if (isRemoteDatabaseEnabled) return (await selectAttendance(employeeId)).map(mapRecord);
  return getAllAttendance().filter((r) => r.employeeId === employeeId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(mapRecord);
}

export async function getAllAttendanceHistory() {
  if (isRemoteDatabaseEnabled) return (await selectAllAttendance()).map(mapRecord);
  return getAllAttendance().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(mapRecord);
}

export async function getLatestAttendance(employeeId) { const history = await getAttendanceHistory(employeeId); return history[0] || null; }
export async function hasAttendedToday(employeeId) { const today = new Date().toDateString(); const history = await getAttendanceHistory(employeeId); return history.some((r) => new Date(r.timestamp).toDateString() === today); }
