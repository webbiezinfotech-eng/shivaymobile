import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout, { sameerBottomNav } from '../../components/Layout/AppLayout';
import BackButton from '../../components/common/BackButton';
import StatusBadge from '../../components/entries/StatusBadge';
import CostBreakdownDisplay from '../../components/entries/CostBreakdownDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntryDetails } from '../../services/entryService';
import { formatCurrency, formatDate, formatDateTime, formatProfitLabel } from '../../utils/formatters';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';

const navItems = [
  { to: '/sameer', label: 'Dashboard' },
  { to: '/sameer/add-entry', label: 'Add Entry' },
  { to: '/sameer/entries', label: 'My Entries' },
];

export default function SameerEntryDetails() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <AppLayout title="Entry Details" navItems={navItems} bottomNavItems={sameerBottomNav}>
      <BackButton fallback="/sameer/entries" label="← Back to My Entries" />

      {loading && <LoadingSpinner />}
      {error && <AlertMessage message={error} />}

      {!loading && entry && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Entry #{entry.id}</p>
              <h2 className="text-2xl font-bold text-slate-900">{entry.item_name}</h2>
            </div>
            <StatusBadge status={entry.settlement_status} />
          </div>

          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Entry Information</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Date" value={formatDate(entry.entry_date)} />
            <DetailItem label="Customer" value={entry.customer_name} />
            <DetailItem label="Customer Amount" value={formatCurrency(entry.customer_amount)} />
            <DetailItem label="Purchase Cost" value={formatCurrency(entry.purchase_cost)} />
            <DetailItem label="Purchased From" value={entry.source_shop} />
            <DetailItem label="Profit" value={formatProfitLabel(entry.profit)} />
            <DetailItem label="Created At" value={formatDateTime(entry.created_at)} />
          </dl>

          {entry.cost_breakdown?.length > 0 && (
            <div className="mt-4">
              <CostBreakdownDisplay items={entry.cost_breakdown} />
            </div>
          )}

          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Settlement</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Status" value={entry.settlement_status.toUpperCase()} />
            <DetailItem label="Settlement Date" value={entry.settled_at ? formatDateTime(entry.settled_at) : '-'} />
            <DetailItem label="Settled By" value={entry.settled_by_name || '-'} />
          </dl>

          {entry.settlement_status === 'settled' && (
            <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
              <p className="font-semibold">SETTLED</p>
              <p className="text-sm">{formatDateTime(entry.settled_at)} by {entry.settled_by_name}</p>
            </div>
          )}
        </div>
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
