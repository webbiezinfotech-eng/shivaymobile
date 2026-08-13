import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import StatusBadge from '../../components/entries/StatusBadge';
import EntryOwnerActions from '../../components/entries/EntryOwnerActions';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntries, settleEntry, deleteEntry } from '../../services/entryService';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';


export default function PendingSettlements() {
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleConfirmSettle = async () => {
    if (!confirmEntry) return;
    setSettling(true);
    setError('');
    setSuccess('');

    try {
      await settleEntry(confirmEntry.id);
      setSuccess('Entry marked as settled.');
      setConfirmEntry(null);
      await loadPending({ silent: true });
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
      await loadPending({ silent: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Pending Settlements" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      {success && <div className="mb-4"><AlertMessage type="success" message={success} /></div>}
      {error && <div className="mb-4"><AlertMessage message={error} /></div>}
      {loading && <LoadingSpinner />}

      {!loading && (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              No pending settlements.
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.item_name}</p>
                    <p className="text-sm text-slate-500">{formatShortDate(entry.entry_date)} · {entry.customer_name}</p>
                  </div>
                  <StatusBadge status={entry.settlement_status} />
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-slate-500">Customer Amount</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(entry.customer_amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Profit</p>
                    <p className="font-medium">{formatCurrency(entry.profit)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Source</p>
                    <p className="font-medium">{entry.source_shop}</p>
                  </div>
                </div>
                <EntryOwnerActions
                  entry={entry}
                  fromPath={location.pathname}
                  onSettle={setConfirmEntry}
                  onDelete={setDeleteEntryTarget}
                  settling={settling && confirmEntry?.id === entry.id}
                  deleting={deleting && deleteEntryTarget?.id === entry.id}
                  compact
                />
              </div>
            ))
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
