import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import StatCard from '../../components/dashboard/StatCard';
import EntryTable from '../../components/entries/EntryTable';
import SettlementConfirmModal from '../../components/entries/SettlementConfirmModal';
import DeleteConfirmModal from '../../components/entries/DeleteConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { fetchOwnerReport } from '../../utils/reportBuilder';
import { settleEntry, deleteEntry } from '../../services/entryService';
import { downloadReportPdfFile, buildReportItemSummary, getSourcePurchaseTotal, isSourceReport, getSearchPerspectiveLabel } from '../../utils/reportPdf';
import { formatCurrency } from '../../utils/formatters';
import { useRefreshOnResume } from '../../utils/useAutoRefresh';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { ApiError } from '../../services/api';


const emptyFilters = {
  from_date: '',
  to_date: '',
  status: '',
  search: '',
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
};

export default function MonthlyReport() {
  const [filters, setFilters] = useState(emptyFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const hasLoadedOnce = useRef(false);

  const useDateRange = filters.from_date !== '' && filters.to_date !== '';
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
    const base = useDateRange
      ? {
          from_date: filters.from_date,
          to_date: filters.to_date,
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
  }, [useDateRange, filters.from_date, filters.to_date, filters.status, filters.year, filters.month, debouncedSearch]);

  const reportParamsRef = useRef(reportParams);
  reportParamsRef.current = reportParams;

  const reportParamsKey = useMemo(() => JSON.stringify(reportParams), [reportParams]);

  const lastFetchKeyRef = useRef('');
  const fetchInFlightRef = useRef(false);

  const loadReport = useCallback(async ({ silent = false } = {}) => {
    const params = reportParamsRef.current;
    const fetchKey = JSON.stringify(params);

    if (fetchInFlightRef.current) return;
    if (silent && fetchKey === lastFetchKeyRef.current) return;

    fetchInFlightRef.current = true;

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
      setReport(data);
      lastFetchKeyRef.current = fetchKey;
    } catch (err) {
      if (!silent) {
        setReport(null);
        setError(err instanceof ApiError ? err.message : 'Unable to connect to server.');
      }
    } finally {
      fetchInFlightRef.current = false;
      if (!silent) {
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
      await loadReport();
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
            />
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
            <label htmlFor="search" className="label-text">Search by name</label>
            <input
              id="search"
              name="search"
              type="search"
              className="input-field"
              placeholder="Customer, source shop ya item name — filter select ki zaroorat nahi"
              value={filters.search}
              onChange={handleFilterChange}
              autoComplete="off"
            />
          </div>
        </div>

        {!useDateRange && (
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
              <EntryTable
                entries={report.entries}
                showOwnerColumns
                detailBasePath="/owner/entries"
                showOwnerActions
                onSettleClick={setConfirmEntry}
                onDeleteClick={setDeleteEntryTarget}
                settlingId={settling ? confirmEntry?.id : null}
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
      <DeleteConfirmModal
        entry={deleteEntryTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteEntryTarget(null)}
        loading={deleting}
      />
    </AppLayout>
  );
}
