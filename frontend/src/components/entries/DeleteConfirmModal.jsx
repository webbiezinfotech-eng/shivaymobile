import { formatCurrency } from '../../utils/formatters';

export default function DeleteConfirmModal({ entry, onConfirm, onCancel, loading = false }) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Delete Entry?</h3>
        <p className="mt-2 text-sm text-slate-600">
          This will permanently remove the entry for <strong>{entry.item_name}</strong> ({entry.customer_name}).
        </p>
        <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <dt className="text-slate-500">Customer Amount</dt>
            <dd className="font-semibold text-slate-900">{formatCurrency(entry.customer_amount)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-semibold uppercase text-slate-900">{entry.settlement_status}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger flex-1" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
