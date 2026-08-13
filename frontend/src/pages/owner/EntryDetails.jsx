import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import BackButton from '../../components/common/BackButton';
import StatusBadge from '../../components/entries/StatusBadge';
import CostBreakdownDisplay from '../../components/entries/CostBreakdownDisplay';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntryDetails, settleEntry, deleteEntry } from '../../services/entryService';
import { formatCurrency, formatDate, formatDateTime, formatProfitLabel } from '../../utils/formatters';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';


export default function EntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEntry = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');

    try {
      const data = await getEntryDetails(id);
      setEntry(data);
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  useRefreshOnResume(loadEntry);

  const handleConfirmSettle = async () => {
    setSettling(true);
    setError('');
    setSuccess('');

    try {
      const updated = await settleEntry(Number(id));
      setEntry(updated);
      setSuccess('Entry marked as settled.');
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setSettling(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteEntry(Number(id));
      navigate('/owner/entries', { replace: true, state: { deleted: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const isPending = entry?.settlement_status === 'pending';

  return (
    <AppLayout title="Entry Details" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      <BackButton fallback="/owner/entries" />

      {loading && <LoadingSpinner />}
      {error && !entry && <AlertMessage message={error} />}
      {success && <div className="mb-4"><AlertMessage type="success" message={success} /></div>}
      {error && entry && <div className="mb-4"><AlertMessage message={error} /></div>}

      {!loading && entry && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Entry ID #{entry.id}</p>
              <h2 className="text-2xl font-bold text-slate-900">{entry.item_name}</h2>
            </div>
            <StatusBadge status={entry.settlement_status} />
          </div>

          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Entry Information</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Date" value={formatDate(entry.entry_date)} />
            <DetailItem label="Item / Work" value={entry.item_name} />
            <DetailItem label="Customer" value={entry.customer_name} />
            <DetailItem label="Customer Amount" value={formatCurrency(entry.customer_amount)} />
            <DetailItem label="Purchase Cost" value={formatCurrency(entry.purchase_cost)} />
            {entry.cost_breakdown?.length > 0 && (
              <div className="sm:col-span-2">
                <CostBreakdownDisplay items={entry.cost_breakdown} />
              </div>
            )}
            <DetailItem label="Purchased From" value={entry.source_shop} />
            <DetailItem label="Profit" value={formatProfitLabel(entry.profit)} />
            <DetailItem label="Created By" value={entry.created_by_name} />
            <DetailItem label="Created At" value={formatDateTime(entry.created_at)} />
          </dl>

          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Settlement</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Status" value={entry.settlement_status.toUpperCase()} />
            <DetailItem label="Settlement Date" value={entry.settled_at ? formatDateTime(entry.settled_at) : '-'} />
            <DetailItem label="Settled By" value={entry.settled_by_name || '-'} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/owner/entries/${entry.id}/edit`} className="btn-secondary">
              Edit Entry
            </Link>
            {isPending ? (
              <button type="button" className="btn-success" onClick={() => setShowConfirm(true)}>
                Mark as Settled
              </button>
            ) : (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
                <p className="font-semibold">SETTLED</p>
                <p className="text-sm">{formatDateTime(entry.settled_at)} by {entry.settled_by_name}</p>
              </div>
            )}
            <button type="button" className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete Entry
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <SettlementConfirmModal
          entry={entry}
          onConfirm={handleConfirmSettle}
          onCancel={() => setShowConfirm(false)}
          loading={settling}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          entry={entry}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
        />
      )}
    </AppLayout>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
