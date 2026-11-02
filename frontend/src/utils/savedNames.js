import { fetchSavedNames, saveNameToServer } from '../services/savedNamesService';

export function normalizeNames(names) {
  const seen = new Map();
  for (const raw of names) {
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, trimmed);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

let cachedNames = { customers: [], sources: [] };

export function clearLegacyNameStorage() {
  try {
    const keysToRemove = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (
        key
        && (
          key.startsWith('shivay_picker_v2_')
          || key.startsWith('shivay_extra_names_')
          || key.startsWith('shivay_names_migrated_')
        )
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage cleanup errors.
  }
}

clearLegacyNameStorage();

export async function loadSavedNames() {
  const data = await fetchSavedNames();
  cachedNames = {
    customers: normalizeNames(data?.customers || []),
    sources: normalizeNames(data?.sources || []),
  };
  return cachedNames;
}

export function getCachedNamesForType(nameType) {
  return nameType === 'source' ? cachedNames.sources : cachedNames.customers;
}

export function getAllCachedSearchNames() {
  return normalizeNames([...cachedNames.customers, ...cachedNames.sources]);
}

export async function savePickerName(nameType, name) {
  const trimmed = String(name).trim();
  if (!trimmed) return null;

  const data = await saveNameToServer(nameType, trimmed);
  await loadSavedNames();
  return data?.name || trimmed;
}

export function getNoAutocompleteInputProps({ id, storageKey }) {
  return {
    id,
    name: `shivay-no-autofill-${storageKey}-${id}`,
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    'data-1p-ignore': 'true',
    'data-lpignore': 'true',
    'data-form-type': 'other',
  };
}

export function setupSavedNamesAutoRefresh(onRefresh) {
  const handleRefresh = () => {
    loadSavedNames()
      .then(onRefresh)
      .catch(() => onRefresh({ customers: [], sources: [] }));
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      handleRefresh();
    }
  };

  window.addEventListener('focus', handleRefresh);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    window.removeEventListener('focus', handleRefresh);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
