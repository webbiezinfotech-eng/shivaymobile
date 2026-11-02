import { request } from './api';

export async function fetchSavedNames() {
  const payload = await request(`/entries/saved-names.php?_=${Date.now()}`);
  return payload.data;
}

export async function saveNameToServer(nameType, name) {
  const payload = await request('/entries/saved-names.php', {
    method: 'POST',
    body: {
      name_type: nameType,
      name: name.trim(),
    },
  });
  return payload.data;
}
