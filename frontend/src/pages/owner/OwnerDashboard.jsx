import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import StatCard from '../../components/dashboard/StatCard';
import EntryTable from '../../components/entries/EntryTable';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import UndoSettleConfirmModal from '../../components/entries/UndoSettleConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getOwnerDashboard } from '../../services/dashboardService';
import { settleEntry, undoSettleEntry, deleteEntry } from '../../services/entryService';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';
import usePagedList from '../../utils/usePagedList';
import { ListSearchBar, ListPager } from '../../components/common/ListControls';


export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [undoEntry, setUndoEntry] = useState(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [undoing, setUndoing] = useState(false);
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

  // 10-per-page pager — search change hote hi page 1 par reset
  const {
    page,
    totalPages,
    totalItems,
    pageStart,
    pageEnd,
    pageItems,
    goToPage,
  } = usePagedList(data?.recent_entries || [], { externalSearch: search, onExternalSearchChange: setSearch });

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

  const handleConfirmUndo = async () => {
    if (!undoEntry) return;
    setUndoing(true);
    setError('');
    setSuccess('');

    try {
      await undoSettleEntry(undoEntry.id);
      setSuccess('Settlement undone. Entry is pending again.');
      setUndoEntry(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setUndoing(false);
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
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Today's Entries" value={today.entry_count} />
            <StatCard label="Today's Amount" value={today.customer_amount} isCurrency />
            <StatCard label="Today's Profit" value={today.profit} isProfit />
            <StatCard label="Pending Settlement" value={data.pending_settlement_total} isCurrency />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Link to="/owner/add-entry" className="btn-primary text-center">
              + Add Entry
            </Link>
            <Link to="/owner/pending" className="btn-secondary text-center">
              Pending
            </Link>
            <Link to="/owner/reports" className="btn-secondary text-center">
              Reports
            </Link>
          </div>

          <section>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Entries</h2>
                <p className="text-sm text-slate-500">Sirf aaj ki entries — purani dekhne ke liye Reports use karein</p>
              </div>
              <ListSearchBar
                value={search}
                onChange={setSearch}
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
            <EntryTable
              entries={pageItems}
              showOwnerColumns
              showOwnerActions
              onSettleClick={setConfirmEntry}
              onUndoClick={setUndoEntry}
              onDeleteClick={setDeleteEntryTarget}
              settlingId={settling ? confirmEntry?.id : null}
              undoingId={undoing ? undoEntry?.id : null}
              deletingId={deleting ? deleteEntryTarget?.id : null}
            />
          </section>

          {monthly && (
            <section className="hidden rounded-2xl border border-slate-200 bg-white p-4 md:block">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Monthly Summary</h2>
                <Link to="/owner/reports" className="text-sm font-semibold text-brand-700">
                  Full Report
                </Link>
              </div>
              <p className="mb-3 text-sm font-medium uppercase text-slate-500">{monthly.month_label}</p>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
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
      <UndoSettleConfirmModal
        entry={undoEntry}
        onConfirm={handleConfirmUndo}
        onCancel={() => setUndoEntry(null)}
        loading={undoing}
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
