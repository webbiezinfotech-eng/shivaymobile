export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  const hasDecimals = !Number.isInteger(value);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function formatProfitLabel(profit) {
  const value = Number(profit) || 0;
  if (value < 0) {
    return `Loss: ${formatCurrency(Math.abs(value))}`;
  }
  return formatCurrency(value);
}

export function getTodayDateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

export function getMonthStartDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function getDefaultReportFilters() {
  const now = new Date();
  // Report default = ALL TIME. Pehle default aaj ki date tha, isliye purani
  // pending entries naam se search karne par report me kuch nahi aata tha.
  return {
    from_date: '',
    to_date: '',
    status: '',
    search: '',
    all_time: true,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function getDefaultAllEntriesFilters() {
  const today = getTodayDateInputValue();
  return {
    date_from: today,
    date_to: today,
    search: '',
    status: '',
  };
}
