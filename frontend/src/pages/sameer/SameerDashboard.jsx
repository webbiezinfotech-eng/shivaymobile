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

const navItems = [
  { to: '/sameer', label: 'Dashboard', end: true },
  { to: '/sameer/add-entry', label: 'Add Entry' },
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

  return (
    <AppLayout title="Dashboard" navItems={navItems} bottomNavItems={sameerBottomNav}>
      {loading && <LoadingSpinner />}
      {error && <AlertMessage message={error} />}
      {!loading && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Today's Entries" value={data.today_entry_count} />
            <StatCard label="This Month" value={data.month_entry_count} />
            <StatCard label="Pending" value={data.pending_entry_count} />
          </div>

          <Link to="/sameer/add-entry" className="btn-primary w-full sm:w-auto">
            + Add New Entry
          </Link>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">My Recent Entries</h2>
            <EntryTable entries={data.recent_entries} detailBasePath="/sameer/entries" />
          </section>
        </div>
      )}
    </AppLayout>
  );
}
