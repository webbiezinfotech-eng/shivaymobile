import StatusBadge from './StatusBadge';
import CostBreakdownDisplay from './CostBreakdownDisplay';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function EntryViewModal({ entry, showOwnerDetails = false, onClose }) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Entry Details</h3>
            <p className="mt-1 text-sm text-slate-500">{formatDate(entry.entry_date)}</p>
          </div>
          <StatusBadge status={entry.settlement_status} />
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Item / Work</dt>
            <dd className="font-semibold text-slate-900">{entry.item_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Customer</dt>
            <dd className="text-base font-bold text-slate-900">{entry.customer_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Customer Amount</dt>
            <dd className="text-lg font-bold text-brand-800">{formatCurrency(entry.customer_amount)}</dd>
          </div>
          {showOwnerDetails && (
            <>
              <div>
                <dt className="text-slate-500">Purchase Cost</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(entry.purchase_cost)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Profit</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(entry.profit)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Purchased From</dt>
                <dd className="font-semibold text-slate-900">{entry.source_shop}</dd>
              </div>
            </>
          )}
          {entry.created_by_name && (
            <div>
              <dt className="text-slate-500">Added By</dt>
              <dd className="font-medium text-slate-900">{entry.created_by_name}</dd>
            </div>
          )}
        </dl>

        {showOwnerDetails && entry.cost_breakdown?.length > 0 && (
          <div className="mt-4">
            <CostBreakdownDisplay items={entry.cost_breakdown} />
          </div>
        )}

        <button type="button" onClick={onClose} className="btn-secondary mt-5 w-full">
          Close
        </button>
      </div>
    </div>
  );
}
