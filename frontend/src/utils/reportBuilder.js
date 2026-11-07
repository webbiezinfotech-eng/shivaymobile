import { getMonthlyReport } from '../services/dashboardService';

function padMonth(month) {
  return String(month).padStart(2, '0');
}

function getMonthDateRange(params) {
  if (params.all_time) {
    return { from_date: '', to_date: '' };
  }

  // Custom date range
  if (params.from_date || params.to_date) {
    const selectedDate = params.from_date || params.to_date;

    return {
      from_date: params.from_date || selectedDate,
      to_date: params.to_date || selectedDate,
    };
  }

  // Monthly date range
  const year = Number(params.year);
  const month = Number(params.month);

  const from_date = `${year}-${padMonth(month)}-01`;

  // Local date calculation — timezone issue avoid karega
  const lastDay = new Date(year, month, 0).getDate();
  const to_date = `${year}-${padMonth(month)}-${String(lastDay).padStart(2, '0')}`;

  return { from_date, to_date };
}
function buildPeriodLabel(params, { from_date, to_date }) {
  if (params.all_time) {
    return 'ALL TIME';
  }

  if (params.from_date || params.to_date) {
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

/**
 * Report hamesha server-side monthly.php se aata hai — search bhi backend
 * khud filter karta hai (customer/source/item/all), isliye date range + search
 * dono lagu hone par bhi POORI matching list milti hai (koi 100-entry
 * client-side cap nahi, koi khud se summary nahi banti).
 */
export async function fetchOwnerReport(params) {
  const range = getMonthDateRange(params);
  const hasSearch = Boolean(params.search && String(params.search).trim());

  const reportParams = {
    ...params,
    from_date: range.from_date,
    to_date: range.to_date,
  };

  // All Time report me date range query me nahi jani chahiye,
  // warna backend purani (pending) entries filter kar deta hai.
  if (params.all_time) {
    reportParams.all_time = 1;
    delete reportParams.from_date;
    delete reportParams.to_date;
  }

  // Server report ke label ke liye search_type detect karta hai —
  // client-side detection server ke response ko override nahi karega.
  const data = await getMonthlyReport(reportParams);

  if (hasSearch && (!data.search_type || data.search_type === 'all')) {
    // Fallback: agar server ne type nahi bataya to client-side entries se detect karein
    data.search_type = detectSearchPerspective(data.entries || [], String(params.search).trim());
    data.month_label = `${buildPeriodLabel(params, range)}${buildSearchLabel(String(params.search).trim(), data.search_type)}`;
  }

  return data;
}
