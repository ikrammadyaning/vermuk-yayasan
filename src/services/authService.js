import { findEmployeeByCode, findEmployeeByUsername, insertEmployee, isRemoteDatabaseEnabled, updateEmployee } from "./database";

const EMPLOYEES_KEY = "attendance_employees";
const SESSION_KEY = "attendance_session";

// Dummy admin account requested by the client. This is intentionally local and
// does not use Supabase Auth or the employees table.
const ADMIN_USERNAME = "admin 1";
const ADMIN_PASSWORD = "karisma";

function readEmployees() { try { return JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || "[]"); } catch { return []; } }
function writeEmployees(employees) { localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees)); }

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toEmployee(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name ?? row.fullName,
    employeeCode: row.employee_code ?? row.employeeCode,
    username: row.username,
    faceEnrolled: Boolean(row.face_enrolled ?? row.faceEnrolled),
    faceDescriptor: row.face_descriptor ?? row.faceDescriptor ?? null,
    createdAt: row.created_at ?? row.createdAt,
    role: "staff",
  };
}

export function isAdminCredentials(username, password) {
  return username.trim().toLowerCase() === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createAdminSession() {
  const admin = {
    id: "admin-demo-1",
    fullName: "Admin 1",
    username: "Admin 1",
    role: "admin",
  };
  setCurrentEmployee(admin);
  return admin;
}

export function isAdmin(employee = getCurrentEmployee()) {
  return employee?.role === "admin";
}

export async function registerEmployee({ fullName, employeeCode, username, password }) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedCode = employeeCode.trim().toUpperCase();
  const passwordHash = await hashPassword(password);

  if (isRemoteDatabaseEnabled) {
    if (await findEmployeeByUsername(normalizedUsername)) throw new Error("Username sudah digunakan.");
    if (await findEmployeeByCode(normalizedCode)) throw new Error("ID staff sudah digunakan.");
    const row = await insertEmployee({ full_name: fullName.trim(), employee_code: normalizedCode, username: normalizedUsername, password_hash: passwordHash, face_enrolled: false, face_descriptor: null });
    const employee = toEmployee(row);
    setCurrentEmployee(employee);
    return employee;
  }

  const employees = readEmployees();
  if (employees.some((e) => e.username === normalizedUsername)) throw new Error("Username sudah digunakan.");
  if (employees.some((e) => e.employeeCode === normalizedCode)) throw new Error("ID staff sudah digunakan.");
  const employee = { id: crypto.randomUUID(), fullName: fullName.trim(), employeeCode: normalizedCode, username: normalizedUsername, passwordHash, faceEnrolled: false, faceDescriptor: null, createdAt: new Date().toISOString() };
  writeEmployees([...employees, employee]);
  const safe = sanitizeEmployee(employee);
  setCurrentEmployee(safe);
  return safe;
}

export async function loginEmployee(username, password) {
  if (isAdminCredentials(username, password)) return createAdminSession();

  const normalizedUsername = username.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  if (isRemoteDatabaseEnabled) {
    const row = await findEmployeeByUsername(normalizedUsername);
    if (!row || row.password_hash !== passwordHash) throw new Error("Username atau password salah.");
    const employee = toEmployee(row);
    setCurrentEmployee(employee);
    return employee;
  }

  const employee = readEmployees().find((e) => e.username === normalizedUsername);
  if (!employee || employee.passwordHash !== passwordHash) throw new Error("Username atau password salah.");
  const safe = sanitizeEmployee(employee);
  setCurrentEmployee(safe);
  return safe;
}

export function setCurrentEmployee(employee) { localStorage.setItem(SESSION_KEY, JSON.stringify(employee)); }
export function getCurrentEmployee() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } }
export function logoutEmployee() { localStorage.removeItem(SESSION_KEY); }

export async function updateFaceEnrollment(employeeId, enrollment) {
  const descriptor = enrollment?.descriptor ?? enrollment;
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    throw new Error("Data wajah tidak valid.");
  }

  if (isRemoteDatabaseEnabled) {
    const row = await updateEmployee(employeeId, {
      face_enrolled: true,
      face_descriptor: descriptor,
    });
    const employee = toEmployee(row);
    setCurrentEmployee(employee);
    return employee;
  }

  const employees = readEmployees();
  const updated = employees.map((employee) => employee.id === employeeId
    ? { ...employee, faceEnrolled: true, faceDescriptor: descriptor }
    : employee
  );
  writeEmployees(updated);
  const employee = updated.find((item) => item.id === employeeId);
  if (!employee) throw new Error("Akun staff tidak ditemukan.");
  const safe = sanitizeEmployee(employee);
  setCurrentEmployee(safe);
  return safe;
}

export function getEmployeeById(id) {
  if (isRemoteDatabaseEnabled) return getCurrentEmployee()?.id === id ? getCurrentEmployee() : null;
  return readEmployees().find((employee) => employee.id === id) || null;
}

function sanitizeEmployee(employee) {
  if (!employee) return null;
  const { passwordHash, faceEnrollmentImage, ...safe } = employee;
  return safe;
}
