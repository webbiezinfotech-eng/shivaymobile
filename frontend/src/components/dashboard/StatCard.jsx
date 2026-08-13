import { formatCurrency, formatProfitLabel } from '../../utils/formatters';

export default function StatCard({ label, value, isCurrency = false, isProfit = false }) {
  let displayValue = value;

  if (isProfit) {
    displayValue = formatProfitLabel(value);
  } else if (isCurrency) {
    displayValue = formatCurrency(value);
  }

  return (
    <div className="stat-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{displayValue}</p>
    </div>
  );
}
