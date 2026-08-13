import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import StatCard from '../../components/dashboard/StatCard';
import EntryTable from '../../components/entries/EntryTable';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getOwnerDashboard } from '../../services/dashboardService';
import { settleEntry, deleteEntry } from '../../services/entryService';
import { filterEntries } from '../../utils/searchEntries';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';


export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDashboard = useCallback(({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    return getOwnerDashboard()
      .then(setData)
      .catch((err) => {
        if (!silent) {
          setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useRefreshOnResume(loadDashboard);

  const filteredEntries = useMemo(
    () => filterEntries(data?.recent_entries || [], search),
    [data?.recent_entries, search]
  );

  const handleConfirmSettle = async () => {
    if (!confirmEntry) return;
    setSettling(true);
    setError('');
    setSuccess('');

    try {
      await settleEntry(confirmEntry.id);
      setSuccess('Entry marked as settled.');
      setConfirmEntry(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setSettling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteEntryTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteEntry(deleteEntryTarget.id);
      setSuccess('Entry deleted.');
      setDeleteEntryTarget(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setDeleting(false);
    }
  };

  const today = data?.today;
  const monthly = data?.monthly_summary;

  return (
    <AppLayout title="Dashboard" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      {loading && <LoadingSpinner />}
      {success && <div className="mb-4"><AlertMessage type="success" message={success} /></div>}
      {error && <div className="mb-4"><AlertMessage message={error} /></div>}
      {!loading && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Today's Entries" value={today.entry_count} />
            <StatCard label="Today's Customer Amount" value={today.customer_amount} isCurrency />
            <StatCard label="Today's Profit" value={today.profit} isProfit />
            <StatCard label="Pending Settlement" value={data.pending_settlement_total} isCurrency />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/owner/add-entry" className="btn-primary">
              + Add New Entry
            </Link>
            <Link to="/owner/pending" className="btn-secondary">
              View Pending Settlements
            </Link>
            <Link to="/owner/entries" className="btn-secondary">
              All Entries
            </Link>
          </div>

          <section>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Entries</h2>
              <input
                type="search"
                className="input-field sm:max-w-xs"
                placeholder="Search item, customer, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <EntryTable
              entries={filteredEntries}
              showOwnerColumns
              detailBasePath="/owner/entries"
              showOwnerActions
              onSettleClick={setConfirmEntry}
              onDeleteClick={setDeleteEntryTarget}
              settlingId={settling ? confirmEntry?.id : null}
              deletingId={deleting ? deleteEntryTarget?.id : null}
            />
          </section>

          {monthly && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Monthly Summary</h2>
                <Link to="/owner/reports" className="text-sm font-semibold text-brand-700">
                  Full Report
                </Link>
              </div>
              <p className="mb-3 text-sm font-medium uppercase text-slate-500">{monthly.month_label}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Total Entries" value={monthly.total_entries} />
                <StatCard label="Customer Amount" value={monthly.total_customer_amount} isCurrency />
                <StatCard label="Purchase Cost" value={monthly.total_purchase_cost} isCurrency />
                <StatCard label="Profit" value={monthly.total_profit} isProfit />
                <StatCard label="Settled" value={monthly.settled_amount} isCurrency />
                <StatCard label="Pending" value={monthly.pending_amount} isCurrency />
              </div>
            </section>
          )}
        </div>
      )}

      <SettlementConfirmModal
        entry={confirmEntry}
        onConfirm={handleConfirmSettle}
        onCancel={() => setConfirmEntry(null)}
        loading={settling}
      />
      <DeleteConfirmModal
        entry={deleteEntryTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteEntryTarget(null)}
        loading={deleting}
      />
    </AppLayout>
  );
}
