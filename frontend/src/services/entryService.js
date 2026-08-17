import { request } from './api';

export async function createEntry(entryData) {
  const payload = await request('/entries/create.php', {
    method: 'POST',
    body: entryData,
  });
  return payload.data;
}

export async function getEntries(params = {}) {
  const query = new URLSearchParams();
  const mapped = { ...params };
  if (mapped.date_from) {
    mapped.from_date = mapped.date_from;
    delete mapped.date_from;
  }
  if (mapped.date_to) {
    mapped.to_date = mapped.date_to;
    delete mapped.date_to;
  }
  Object.entries(mapped).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  const payload = await request(`/entries/list.php${qs ? `?${qs}` : ''}`);
  return payload.data;
}

export async function getEntryDetails(id) {
  const payload = await request(`/entries/details.php?id=${id}`);
  return payload.data;
}

export async function settleEntry(entryId) {
  const payload = await request('/entries/settle.php', {
    method: 'POST',
    body: { entry_id: entryId },
  });
  return payload.data;
}

export async function undoSettleEntry(entryId) {
  const payload = await request('/entries/unsettle.php', {
    method: 'POST',
    body: { entry_id: entryId },
  });
  return payload.data;
}

export async function updateEntry(entryData) {
  const payload = await request('/entries/update.php', {
    method: 'POST',
    body: entryData,
  });
  return payload.data;
}

export async function deleteEntry(entryId) {
  const payload = await request('/entries/delete.php', {
    method: 'POST',
    body: { entry_id: entryId },
  });
  return payload.data;
}

export async function getEntrySuggestions(query = '') {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  const payload = await request(`/entries/suggestions.php${qs}`);
  return payload.data;
}
