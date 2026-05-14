/* ══════════════════════════════════════════════════════════════════
   AutoVault V2 — Centralized API Client
   All fetch() calls go through here. Uses credentials: 'include'
   so the HttpOnly cookie is sent automatically with every request.
   ══════════════════════════════════════════════════════════════════ */

const BASE_URL = '/api';

async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send cookie
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  login:    (body) => request('POST', '/auth/login', body),
  register: (body) => request('POST', '/auth/register', body),
  logout:   ()     => request('POST', '/auth/logout'),
  getMe:    ()     => request('GET',  '/auth/me'),

  // Dashboard
  getStats: () => request('GET', '/dashboard/stats'),

  // Vehicles
  getVehicles:    ()       => request('GET',    '/vehicles'),
  getVehicle:     (id)     => request('GET',    `/vehicles/${id}`),
  createVehicle:  (body)   => request('POST',   '/vehicles', body),
  updateVehicle:  (id, body) => request('PUT',  `/vehicles/${id}`, body),
  deleteVehicle:  (id)     => request('DELETE', `/vehicles/${id}`),

  // Maintenance
  getMaintenance:    (vehicleId) => request('GET', `/maintenance${vehicleId ? `?vehicleId=${vehicleId}` : ''}`),
  createMaintenance: (body)      => request('POST',   '/maintenance', body),
  updateMaintenance: (id, body)  => request('PUT',    `/maintenance/${id}`, body),
  deleteMaintenance: (id)        => request('DELETE', `/maintenance/${id}`),

  // Fuel
  getFuel:    (vehicleId) => request('GET', `/fuel${vehicleId ? `?vehicleId=${vehicleId}` : ''}`),
  createFuel: (body)      => request('POST',   '/fuel', body),
  updateFuel: (id, body)  => request('PUT',    `/fuel/${id}`, body),
  deleteFuel: (id)        => request('DELETE', `/fuel/${id}`),

  // Expenses
  getExpenses:    (vehicleId) => request('GET', `/expenses${vehicleId ? `?vehicleId=${vehicleId}` : ''}`),
  createExpense:  (body)      => request('POST',   '/expenses', body),
  updateExpense:  (id, body)  => request('PUT',    `/expenses/${id}`, body),
  deleteExpense:  (id)        => request('DELETE', `/expenses/${id}`),
};
