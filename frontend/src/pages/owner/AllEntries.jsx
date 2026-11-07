import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import EntryTable from '../../components/entries/EntryTable';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import UndoSettleConfirmModal from '../../components/entries/UndoSettleConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { getEntries, settleEntry, undoSettleEntry, deleteEntry } from '../../services/entryService';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { ApiError } from '../../services/api';
import usePagedList from '../../utils/usePagedList';
import { ListPager } from '../../components/common/ListControls';

import { getDefaultAllEntriesFilters } from '../../utils/formatters';

export default function AllEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [undoEntry, setUndoEntry] = useState(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState(() => getDefaultAllEntriesFilters());
  const debouncedFilters = useDebouncedValue(filters, 300);
  const isFirstLoad = useRef(true);

  const debouncedFiltersRef = useRef(debouncedFilters);
  debouncedFiltersRef.current = debouncedFilters;
  const filtersKey = useMemo(() => JSON.stringify(debouncedFilters), [debouncedFilters]);

  // 10-per-page pager — search/filter change hote hi page 1 par reset
  const {
    page,
    totalPages,
    totalItems,
    pageStart,
    pageEnd,
    pageItems,
    goToPage,
  } = usePagedList(entries, { resetKey: entries });

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
      const data = await getEntries({ ...activeFilters, limit: 500 });
      setEntries(data.entries || []);
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
    setFilters(getDefaultAllEntriesFilters());
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

  const handleConfirmUndo = async () => {
    if (!undoEntry) return;
    setUndoing(true);
    setError('');
    setSuccess('');

    try {
      await undoSettleEntry(undoEntry.id);
      setSuccess('Settlement undone.');
      setUndoEntry(null);
      await loadEntries();
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
        <>
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
        </>
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
