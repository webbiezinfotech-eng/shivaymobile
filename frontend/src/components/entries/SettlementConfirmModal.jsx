import { formatCurrency } from '../../utils/formatters';

export default function SettlementConfirmModal({ entry, onConfirm, onCancel, loading = false }) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Mark Entry as Settled?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Has Sameer returned {formatCurrency(entry.customer_amount)} for this entry?
        </p>

        <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <dt className="text-slate-500">Item</dt>
            <dd className="font-semibold text-slate-900">{entry.item_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Customer</dt>
            <dd className="font-semibold text-slate-900">{entry.customer_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Amount to settle</dt>
            <dd className="text-lg font-bold text-slate-900">{formatCurrency(entry.customer_amount)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn-success flex-1" disabled={loading}>
            {loading ? 'Settling...' : 'Confirm Settlement'}
          </button>
        </div>
      </div>
    </div>
  );
}
