import { useCallback, useEffect, useState } from 'react';
import AppLayout, { sameerBottomNav } from '../../components/Layout/AppLayout';
import EntryTable from '../../components/entries/EntryTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntries } from '../../services/entryService';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';

const navItems = [
  { to: '/sameer', label: 'Dashboard' },
  { to: '/sameer/add-entry', label: 'Add Entry' },
  { to: '/sameer/entries', label: 'My Entries', end: true },
];

export default function MyEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEntries = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');

    try {
      const data = await getEntries({ limit: 100 });
      setEntries(data.entries);
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useRefreshOnResume(loadEntries);

  return (
    <AppLayout title="My Entries" navItems={navItems} bottomNavItems={sameerBottomNav}>
      {loading && <LoadingSpinner />}
      {error && <AlertMessage message={error} />}
      {!loading && !error && <EntryTable entries={entries} detailBasePath="/sameer/entries" />}
    </AppLayout>
  );
}
