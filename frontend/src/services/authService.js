import { request } from './api';

export async function login(username, password) {
  const payload = await request('/auth/login.php', {
    method: 'POST',
    body: { username, password },
  });
  return payload.data;
}

export async function logout() {
  await request('/auth/logout.php', { method: 'POST' });
}

export async function getCurrentUser() {
  const payload = await request('/auth/me.php');
  return payload.data;
}

export async function changePassword({ current_password, new_password, confirm_password }) {
  const payload = await request('/auth/change_password.php', {
    method: 'POST',
    body: { current_password, new_password, confirm_password },
  });
  return payload.data;
}
