import { formatCurrency } from '../../utils/formatters';

export default function CostBreakdownDisplay({ items = [] }) {
  if (!items?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-700">Item-wise Cost</p>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">{item.name?.trim() || `Item ${index + 1}`}</span>
            <span className="font-semibold text-slate-900">{formatCurrency(item.cost)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
