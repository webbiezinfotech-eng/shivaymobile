import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import StatCard from '../../components/dashboard/StatCard';
import EntryTable from '../../components/entries/EntryTable';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import UndoSettleConfirmModal from '../../components/entries/UndoSettleConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import SavedNameSearchInput from '../../components/common/SavedNameSearchInput';
import { fetchOwnerReport } from '../../utils/reportBuilder';
import { settleEntry, undoSettleEntry, deleteEntry } from '../../services/entryService';
import { downloadReportPdfFile, buildReportItemSummary, getSourcePurchaseTotal, isSourceReport, getSearchPerspectiveLabel } from '../../utils/reportPdf';
import { formatCurrency, getDefaultReportFilters, getTodayDateInputValue } from '../../utils/formatters';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { ApiError } from '../../services/api';
import usePagedList from '../../utils/usePagedList';
import { ListPager } from '../../components/common/ListControls';



export default function MonthlyReport() {
  const [filters, setFilters] = useState(() => getDefaultReportFilters());
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const [report, setReport] = useState(null);
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
  const [downloading, setDownloading] = useState(false);
  const hasLoadedOnce = useRef(false);

 const useAllTime = Boolean(filters.all_time);
const useDateRange =
  !useAllTime && (filters.from_date !== '' || filters.to_date !== '');
  const isSearching = filters.search !== debouncedSearch;

  const activeSearchType = report?.search_type || 'all';
  const sourceReport = isSourceReport(report);

  const itemSummary = useMemo(
    () => (report?.entries?.length ? buildReportItemSummary(report.entries, activeSearchType) : []),
    [report?.entries, activeSearchType]
  );

  const sourceTotalCost = useMemo(
    () => (sourceReport && report?.entries?.length ? getSourcePurchaseTotal(report.entries) : 0),
    [report?.entries, sourceReport]
  );

  const reportParams = useMemo(() => {
    const base = useAllTime
      ? {
          all_time: 1,
          status: filters.status,
        }
 : useDateRange
  ? {
      from_date: filters.from_date || filters.to_date,
      to_date: filters.to_date || filters.from_date,
      status: filters.status,
    }
        : {
            year: filters.year,
            month: filters.month,
            status: filters.status,
          };

    if (debouncedSearch) {
      base.search = debouncedSearch.trim();
    }

    return base;
  }, [useAllTime, useDateRange, filters.from_date, filters.to_date, filters.status, filters.year, filters.month, debouncedSearch]);

  const reportParamsRef = useRef(reportParams);
  reportParamsRef.current = reportParams;

  const reportParamsKey = useMemo(() => JSON.stringify(reportParams), [reportParams]);

  // Entries table: 10 per page, report filters change hote hi page 1
  const {
    page,
    totalPages,
    totalItems,
    pageStart,
    pageEnd,
    pageItems,
    goToPage,
  } = usePagedList(report?.entries || [], { externalSearch: filters.search, resetKey: reportParamsKey });
const lastFetchKeyRef = useRef('');
const requestIdRef = useRef(0);

 const loadReport = useCallback(async ({ silent = false } = {}) => {
  const params = reportParamsRef.current;
  const fetchKey = JSON.stringify(params);

  // Same report already loaded: silent refresh ki zarurat nahi
  if (silent && fetchKey === lastFetchKeyRef.current) return;

  // Har new request ko unique ID do
  const requestId = ++requestIdRef.current;

  if (!silent) {
    if (hasLoadedOnce.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');
  }

  try {
    const data = await fetchOwnerReport(params);

    // Sirf latest request ka result display hoga
    if (requestId !== requestIdRef.current) return;

    setReport(data);
    lastFetchKeyRef.current = fetchKey;

  } catch (err) {
    // Purani request ka error ignore karo
    if (requestId !== requestIdRef.current) return;

    if (!silent) {
      setReport(null);
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to connect to server.'
      );
    }

  } finally {
    // Sirf latest request loading state update karegi
    if (requestId === requestIdRef.current) {
      setLoading(false);
      setRefreshing(false);
      hasLoadedOnce.current = true;
    }
  }
}, []);

  useEffect(() => {
    loadReport();
  }, [reportParamsKey, loadReport]);

  useRefreshOnResume(loadReport);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters(getDefaultReportFilters());
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
      await loadReport();
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
      await loadReport();
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
      await loadReport();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      await downloadReportPdfFile(report);
    } catch {
      setError('Unable to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout title="Reports" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      <div className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="from_date" className="label-text">From Date</label>
            <input
              id="from_date"
              name="from_date"
              type="date"
              className="input-field"
              value={filters.from_date}
              onChange={handleFilterChange}
              disabled={useAllTime}
            />
          </div>
          <div>
            <label htmlFor="to_date" className="label-text">To Date</label>
            <input
              id="to_date"
              name="to_date"
              type="date"
              className="input-field"
              value={filters.to_date}
              onChange={handleFilterChange}
              disabled={useAllTime}
            />
          </div>
          <div className="flex items-end">
            <label
              htmlFor="all_time"
              className="flex min-h-[46px] w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
            >
              <input
                id="all_time"
                name="all_time"
                type="checkbox"
                className="h-4 w-4"
                checked={useAllTime}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setFilters((prev) => ({
                    ...prev,
                    all_time: checked,
                    from_date: checked ? '' : prev.from_date || getTodayDateInputValue(),
                    to_date: checked ? '' : prev.to_date || getTodayDateInputValue(),
                  }));
                }}
              />
              All Time
            </label>
          </div>
          <div>
            <label htmlFor="status" className="label-text">Status</label>
            <select id="status" name="status" className="input-field" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <SavedNameSearchInput
              id="search"
              name="search"
              label="Search by name"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Saved customer / source name select karein ya type karein"
            />
          </div>
        </div>

        {!useDateRange && !useAllTime && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="month" className="label-text">Month (if no date range)</label>
              <select id="month" name="month" className="input-field" value={filters.month} onChange={handleFilterChange}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString('en-IN', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="label-text">Year (if no date range)</label>
              <input
                id="year"
                name="year"
                type="number"
                className="input-field"
                value={filters.year}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleClearFilters} className="btn-secondary">
            Clear Filters
          </button>
          {report && (
            <button type="button" onClick={handleDownloadPdf} disabled={downloading} className="btn-primary">
              {downloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      {success && <div className="mb-4"><AlertMessage type="success" message={success} /></div>}
      {loading && <LoadingSpinner />}
      {refreshing && !loading && (
        <p className="mb-3 text-sm text-slate-500">{isSearching ? 'Searching...' : 'Updating report...'}</p>
      )}
      {error && <AlertMessage message={error} />}

      {!loading && report && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold uppercase text-slate-900">{report.month_label}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total Entries" value={report.total_entries} />
            {sourceReport ? (
              <StatCard label="Total Cost" value={sourceTotalCost} isCurrency />
            ) : (
              <>
                <StatCard label="Customer Amount" value={report.total_customer_amount} isCurrency />
                <StatCard label="Purchase Cost" value={report.total_purchase_cost} isCurrency />
                <StatCard label="Profit" value={report.total_profit} isProfit />
                <StatCard label="Settled" value={report.settled_amount} isCurrency />
                <StatCard label="Pending" value={report.pending_amount} isCurrency />
              </>
            )}
          </div>

          {report.search && itemSummary.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Item & Source Summary</h3>
              <p className="mb-4 text-sm text-slate-500">
                {getSearchPerspectiveLabel(activeSearchType)} &quot;{report.search}&quot;
                {sourceReport
                  ? ' — source se kitne ka saman aaya (purchase cost, profit nahi)'
                  : activeSearchType === 'customer'
                    ? ' — customer ko diya gaya saman (customer amount)'
                    : ' — matching records'}
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Entries</th>
                      <th className="px-4 py-3">{sourceReport ? 'Purchase Cost' : 'Total Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemSummary.map((row) => (
                      <tr key={`${row.item_name}-${row.source_shop}`} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.item_name}</td>
                        <td className="px-4 py-3 text-slate-700">{row.source_shop}</td>
                        <td className="px-4 py-3 text-slate-700">{row.count}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(row.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {sourceReport && itemSummary.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900" colSpan={3}>Total Cost</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(sourceTotalCost)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </section>
          )}

          {report.entries?.length > 0 ? (
            <section>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Entries</h3>
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
                compactLayout={false}
                onSettleClick={setConfirmEntry}
                onUndoClick={setUndoEntry}
                onDeleteClick={setDeleteEntryTarget}
                settlingId={settling ? confirmEntry?.id : null}
                undoingId={undoing ? undoEntry?.id : null}
                deletingId={deleting ? deleteEntryTarget?.id : null}
              />
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              No entries found for selected filters.
            </div>
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
