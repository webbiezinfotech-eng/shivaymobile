import { request } from './api';

export async function getSameerDashboard() {
  const payload = await request('/dashboard/sameer.php');
  return payload.data;
}

export async function getOwnerDashboard() {
  const payload = await request('/dashboard/owner.php');
  return payload.data;
}

export async function getMonthlyReport(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  const payload = await request(`/reports/monthly.php${qs ? `?${qs}` : ''}`);
  return payload.data;
}
