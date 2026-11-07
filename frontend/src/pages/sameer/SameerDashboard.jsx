import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout, { sameerBottomNav } from '../../components/Layout/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import EntryTable from '../../components/entries/EntryTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getSameerDashboard } from '../../services/dashboardService';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';
import usePagedList from '../../utils/usePagedList';
import { ListSearchBar, ListPager } from '../../components/common/ListControls';

const navItems = [
  { to: '/sameer', label: 'Dashboard', end: true },
  { to: '/sameer/add-entry', label: 'Add Entry' },
  { to: '/sameer/pending', label: 'Pending' },
  { to: '/sameer/entries', label: 'My Entries' },
];

export default function SameerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');

    try {
      const result = await getSameerDashboard();
      setData(result);
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useRefreshOnResume(loadDashboard);

  // 10-per-page pager + search — search change hote hi page 1 par reset
  const {
    search,
    onSearchChange,
    page,
    totalPages,
    totalItems,
    pageStart,
    pageEnd,
    pageItems,
    goToPage,
  } = usePagedList(data?.recent_entries || []);

  return (
    <AppLayout title="Dashboard" navItems={navItems} bottomNavItems={sameerBottomNav}>
      {loading && <LoadingSpinner />}
      {error && <AlertMessage message={error} />}
      {!loading && data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Today's Entries" value={data.today_entry_count} />
            <StatCard label="This Month" value={data.month_entry_count} />
            <StatCard label="Pending" value={data.pending_entry_count} />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Link to="/sameer/add-entry" className="btn-primary text-center">
              + Add Entry
            </Link>
            <Link to="/sameer/pending" className="btn-secondary text-center">
              Pending
            </Link>
          </div>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Today&apos;s Entries</h2>
            <p className="mb-3 text-sm text-slate-500">Sirf aaj ki entries</p>
            <div className="mb-3">
              <ListSearchBar
                value={search}
                onChange={onSearchChange}
                placeholder="Search today..."
              />
            </div>
            <ListPager
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageStart={pageStart}
              pageEnd={pageEnd}
              goToPage={goToPage}
            />
            <EntryTable entries={pageItems} detailBasePath="/sameer/entries" />
          </section>
        </div>
      )}
    </AppLayout>
  );
}
