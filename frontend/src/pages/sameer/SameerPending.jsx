import { useCallback, useEffect, useState } from 'react';
import AppLayout, { sameerBottomNav } from '../../components/Layout/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import EntryTable from '../../components/entries/EntryTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntries } from '../../services/entryService';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';
import usePagedList from '../../utils/usePagedList';
import { ListPager } from '../../components/common/ListControls';

const navItems = [
  { to: '/sameer', label: 'Dashboard', end: true },
  { to: '/sameer/add-entry', label: 'Add Entry' },
  { to: '/sameer/pending', label: 'Pending' },
  { to: '/sameer/entries', label: 'My Entries' },
];

export default function SameerPending() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPending = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');

    try {
      const data = await getEntries({ status: 'pending', limit: 100 });
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
    loadPending();
  }, [loadPending]);

  useRefreshOnResume(loadPending);

  // 10-per-page pager — data refresh hone par page 1 se shuru
  const {
    page,
    totalPages,
    totalItems,
    pageStart,
    pageEnd,
    pageItems,
    goToPage,
  } = usePagedList(entries, { resetKey: entries });

  const pendingTotal = entries.reduce((sum, entry) => sum + Number(entry.customer_amount || 0), 0);

  return (
    <AppLayout title="Pending" navItems={navItems} bottomNavItems={sameerBottomNav}>
      {error && <AlertMessage message={error} />}
      {loading && <LoadingSpinner />}

      {!loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Pending Entries" value={entries.length} />
            <StatCard label="Pending Amount" value={pendingTotal} isCurrency />
          </div>

          <ListPager
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageStart={pageStart}
            pageEnd={pageEnd}
            goToPage={goToPage}
            label="pending entries"
          />

          <EntryTable entries={pageItems} detailBasePath="/sameer/entries" />
        </div>
      )}
    </AppLayout>
  );
}
