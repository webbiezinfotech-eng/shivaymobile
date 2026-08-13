import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import CostBreakdownDisplay from '../../components/entries/CostBreakdownDisplay';
import StatusBadge from '../../components/entries/StatusBadge';
import EntryOwnerActions from '../../components/entries/EntryOwnerActions';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntries, settleEntry, deleteEntry } from '../../services/entryService';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';


const emptyFilters = {
  date_from: '',
  date_to: '',
  search: '',
  status: '',
};

export default function AllEntries() {
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const debouncedFilters = useDebouncedValue(filters, 300);
  const isFirstLoad = useRef(true);

  const debouncedFiltersRef = useRef(debouncedFilters);
  debouncedFiltersRef.current = debouncedFilters;
  const filtersKey = useMemo(() => JSON.stringify(debouncedFilters), [debouncedFilters]);

  const loadEntries = useCallback(async ({ silent = false } = {}) => {
    const activeFilters = debouncedFiltersRef.current;
    if (!silent) {
      if (isFirstLoad.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
    }
    if (!silent) setError('');

    try {
      const data = await getEntries({ ...activeFilters, limit: 100 });
      setEntries(data.entries);
    } catch (err) {
      if (!silent) {
        setEntries([]);
        setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [filtersKey, loadEntries]);

  useRefreshOnResume(() => loadEntries({ silent: true }));

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  const handleConfirmSettle = async () => {
    if (!confirmEntry) return;
    setSettling(true);
    setError('');
    setSuccess('');

    try {
      await settleEntry(confirmEntry.id);
      setSuccess('Entry marked as settled.');
      setConfirmEntry(null);
      await loadEntries();
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
      await loadEntries();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="All Entries" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-5">
        <div>
          <label htmlFor="date_from" className="label-text">From Date</label>
          <input id="date_from" name="date_from" type="date" className="input-field" value={filters.date_from} onChange={handleFilterChange} />
        </div>
        <div>
          <label htmlFor="date_to" className="label-text">To Date</label>
          <input id="date_to" name="date_to" type="date" className="input-field" value={filters.date_to} onChange={handleFilterChange} />
        </div>
        <div>
          <label htmlFor="status" className="label-text">Status</label>
          <select id="status" name="status" className="input-field" value={filters.status} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="settled">Settled</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="search" className="label-text">Search</label>
          <input
            id="search"
            name="search"
            type="search"
            className="input-field"
            placeholder="Type to search — item, customer, amount..."
            value={filters.search}
            onChange={handleFilterChange}
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-5">
          <button type="button" onClick={handleClearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {success && <div className="mb-4"><AlertMessage type="success" message={success} /></div>}
      {error && <div className="mb-4"><AlertMessage message={error} /></div>}
      {loading && <LoadingSpinner />}
      {refreshing && !loading && (
        <p className="mb-3 text-sm text-slate-500">Searching...</p>
      )}

      {!loading && (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              No entries found.
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.item_name}</p>
                    <p className="text-sm text-slate-500">{formatShortDate(entry.entry_date)} · {entry.customer_name}</p>
                  </div>
                  <StatusBadge status={entry.settlement_status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div><p className="text-slate-500">Cost</p><p className="font-medium">{formatCurrency(entry.purchase_cost)}</p></div>
                  <div><p className="text-slate-500">Customer Amount</p><p className="font-medium">{formatCurrency(entry.customer_amount)}</p></div>
                  <div><p className="text-slate-500">Profit</p><p className="font-medium">{formatCurrency(entry.profit)}</p></div>
                  <div><p className="text-slate-500">Source</p><p className="font-medium">{entry.source_shop}</p></div>
                </div>
                {entry.cost_breakdown?.length > 0 && (
                  <div className="mt-3">
                    <CostBreakdownDisplay items={entry.cost_breakdown} />
                  </div>
                )}
                <div className="mt-3">
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
