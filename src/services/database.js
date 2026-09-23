const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isRemoteDatabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Database error ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function findEmployeeByUsername(username) {
  const rows = await request(`employees?select=id,full_name,employee_code,username,password_hash,face_enrolled,face_descriptor&username=eq.${encodeURIComponent(username)}&limit=1`);
  return rows?.[0] || null;
}

export async function findEmployeeByCode(employeeCode) {
  const rows = await request(`employees?select=id&employee_code=eq.${encodeURIComponent(employeeCode)}&limit=1`);
  return rows?.[0] || null;
}

export async function insertEmployee(employee) {
  const rows = await request("employees", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(employee),
  });
  return rows?.[0] || null;
}

export async function updateEmployee(id, patch) {
  const rows = await request(`employees?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  return rows?.[0] || null;
}

export async function insertAttendance(record) {
  const rows = await request("attendance", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(record),
  });
  return rows?.[0] || null;
}

export async function selectAttendance(employeeId) {
  return request(`attendance?select=*,employees(full_name,employee_code)&employee_id=eq.${encodeURIComponent(employeeId)}&order=timestamp.desc`);
}

export async function selectAllAttendance() {
  return request("attendance?select=*,employees(full_name,employee_code,username)&order=timestamp.desc");
}
