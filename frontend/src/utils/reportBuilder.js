import { getEntries } from '../services/entryService';
import { getMonthlyReport } from '../services/dashboardService';

function padMonth(month) {
  return String(month).padStart(2, '0');
}

function getMonthDateRange(params) {
  if (params.from_date && params.to_date) {
    return { from_date: params.from_date, to_date: params.to_date };
  }

  const from_date = `${params.year}-${padMonth(params.month)}-01`;
  const to_date = new Date(params.year, params.month, 0).toISOString().slice(0, 10);
  return { from_date, to_date };
}

function buildPeriodLabel(params, { from_date, to_date }) {
  if (params.from_date && params.to_date) {
    const start = new Date(from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const end = new Date(to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${start} - ${end}`.toUpperCase();
  }

  return new Date(params.year, params.month - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

function buildSearchLabel(search, searchType) {
  if (!search) return '';
  const upper = search.toUpperCase();
  if (searchType === 'customer') return ` · CUSTOMER: ${upper}`;
  if (searchType === 'source') return ` · SOURCE: ${upper}`;
  if (searchType === 'item') return ` · ITEM: ${upper}`;
  return ` · ${upper}`;
}

export function filterEntriesBySearch(entries, search, searchType = 'all') {
  if (!search) return entries;

  const query = search.trim().toLowerCase();
  if (!query) return entries;

  return entries.filter((entry) => {
    const customer = String(entry.customer_name || '').toLowerCase();
    const source = String(entry.source_shop || '').toLowerCase();
    const item = String(entry.item_name || '').toLowerCase();

    if (searchType === 'customer') return customer.includes(query);
    if (searchType === 'source') return source.includes(query);
    if (searchType === 'item') return item.includes(query);
    return customer.includes(query) || source.includes(query) || item.includes(query);
  });
}

/** Auto-detect whether search is for a source shop, customer, or item name. */
export function detectSearchPerspective(entries, search) {
  const query = search.trim().toLowerCase();
  if (!query || !entries.length) return 'all';

  let sourceHit = 0;
  let customerHit = 0;
  let itemHit = 0;

  entries.forEach((entry) => {
    const source = String(entry.source_shop || '').toLowerCase();
    const customer = String(entry.customer_name || '').toLowerCase();
    const item = String(entry.item_name || '').toLowerCase();
    if (source.includes(query)) sourceHit += 1;
    if (customer.includes(query)) customerHit += 1;
    if (item.includes(query)) itemHit += 1;
  });

  const allSource = entries.every((entry) =>
    String(entry.source_shop || '').toLowerCase().includes(query)
  );
  const allCustomer = entries.every((entry) =>
    String(entry.customer_name || '').toLowerCase().includes(query)
  );

  if (allSource && sourceHit > 0) return 'source';
  if (allCustomer && customerHit > 0) return 'customer';

  if (sourceHit > 0 && customerHit === 0) return 'source';
  if (customerHit > 0 && sourceHit === 0) return 'customer';
  if (itemHit > 0 && sourceHit === 0 && customerHit === 0) return 'item';

  if (sourceHit > 0 && customerHit > 0) {
    return sourceHit >= customerHit ? 'source' : 'customer';
  }

  return 'all';
}

function sumBy(entries, pickAmount) {
  return entries.reduce((total, entry) => total + Number(pickAmount(entry) || 0), 0);
}

export function buildReportFromEntries(entries, params, range) {
  const searchType = params.search
    ? detectSearchPerspective(entries, params.search)
    : 'all';
  const periodLabel = buildPeriodLabel(params, range) + buildSearchLabel(params.search, searchType);

  const settledEntries = entries.filter((entry) => entry.settlement_status === 'settled');
  const pendingEntries = entries.filter((entry) => entry.settlement_status === 'pending');

  return {
    year: params.year,
    month: params.month,
    from_date: range.from_date,
    to_date: range.to_date,
    status: params.status || 'all',
    search: params.search || '',
    search_type: searchType,
    month_label: periodLabel,
    total_entries: entries.length,
    total_customer_amount: sumBy(entries, (entry) => entry.customer_amount),
    total_purchase_cost: sumBy(entries, (entry) => entry.purchase_cost),
    total_profit: sumBy(entries, (entry) => entry.profit),
    settled_amount: sumBy(settledEntries, (entry) => entry.customer_amount),
    pending_amount: sumBy(pendingEntries, (entry) => entry.customer_amount),
    entries,
  };
}

export async function fetchOwnerReport(params) {
  const range = getMonthDateRange(params);
  const hasSearch = Boolean(params.search && String(params.search).trim());

  if (!hasSearch) {
    return getMonthlyReport(params);
  }

  const listParams = {
    from_date: range.from_date,
    to_date: range.to_date,
    status: params.status || undefined,
    limit: 100,
  };

  const { entries: rawEntries } = await getEntries(listParams);
  const filteredEntries = filterEntriesBySearch(rawEntries, String(params.search).trim(), 'all');

  return buildReportFromEntries(filteredEntries, { ...params, ...range }, range);
}
