import { formatCurrency } from '../../utils/formatters';

export default function CostBreakdownFields({ items, onChange, errors = {} }) {
  const updateItem = (index, field, value) => {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  };

  const addRow = () => {
    onChange([...items, { name: '', cost: '' }]);
  };

  const removeRow = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="mb-3">
        <p className="font-semibold text-slate-900">Item-wise Cost Breakdown</p>
        <p className="mt-1 text-xs text-slate-600">
          Jab ek se zyada cheezein aayi hon — har cheez ki cost alag likho. Total cost auto add hogi.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
            <input
              type="text"
              className="input-field"
              placeholder={`Item ${index + 1} (optional name)`}
              value={item.name}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="Cost"
              value={item.cost}
              onChange={(e) => updateItem(index, 'cost', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="btn-secondary min-h-12 px-3 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className="mt-3 text-sm font-semibold text-brand-700">
        + Add Item Cost
      </button>

      {items.length > 0 && (
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Total Purchase Cost: {formatCurrency(total)}
        </p>
      )}

      {errors.cost_items && <p className="mt-2 text-sm text-red-600">{errors.cost_items}</p>}
    </div>
  );
}
