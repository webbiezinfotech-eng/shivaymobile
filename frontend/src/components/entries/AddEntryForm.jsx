import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../common/AlertMessage';
import CostBreakdownFields from './CostBreakdownFields';
import { calculateProfit } from '../../utils/calculations';
import { formatCurrency, formatProfitLabel, getTodayDateInputValue } from '../../utils/formatters';
import { sumCostItems, validateEntryForm } from '../../utils/validation';
import { createEntry } from '../../services/entryService';
import { ApiError } from '../../services/api';

export default function AddEntryForm({ redirectTo = '/sameer/entries' }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    entry_date: getTodayDateInputValue(),
    item_name: '',
    customer_name: '',
    customer_amount: '',
    purchase_cost: '',
    source_shop: '',
  });
  const [useBreakdown, setUseBreakdown] = useState(false);
  const [costItems, setCostItems] = useState([{ name: '', cost: '' }, { name: '', cost: '' }]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);

  const purchaseCost = useMemo(() => {
    if (useBreakdown) return sumCostItems(costItems);
    return parseFloat(form.purchase_cost) || 0;
  }, [useBreakdown, costItems, form.purchase_cost]);

  const profit = useMemo(
    () => calculateProfit(form.customer_amount, purchaseCost),
    [form.customer_amount, purchaseCost]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!navigator.onLine) {
      setOffline(true);
      setMessage('Internet connection required to save entries.');
      return;
    }

    const validationErrors = validateEntryForm(form, costItems, useBreakdown);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setMessage('');
    setSuccess('');

    const payload = {
      entry_date: form.entry_date,
      item_name: form.item_name.trim(),
      customer_name: form.customer_name.trim(),
      customer_amount: Number(form.customer_amount),
      source_shop: form.source_shop.trim(),
    };

    if (useBreakdown) {
      payload.cost_items = costItems
        .filter((item) => item.cost !== '' && Number(item.cost) > 0)
        .map((item) => ({
          name: item.name.trim(),
          cost: Number(item.cost),
        }));
    } else {
      payload.purchase_cost = Number(form.purchase_cost);
    }

    try {
      await createEntry(payload);
      setSuccess('Entry saved successfully.');
      setTimeout(() => navigate(redirectTo), 1200);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        if (error.errors) setErrors(error.errors);
      } else {
        setMessage('Unable to save entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-5 text-xl font-bold text-slate-900">Add New Entry</h2>

      {offline && (
        <div className="mb-4">
          <AlertMessage type="info" message="Internet connection required to save entries." />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="entry_date" className="label-text">Date</label>
          <input id="entry_date" name="entry_date" type="date" className="input-field" value={form.entry_date} max={getTodayDateInputValue()} onChange={handleChange} />
          {errors.entry_date && <p className="mt-1 text-sm text-red-600">{errors.entry_date}</p>}
        </div>

        <div>
          <label htmlFor="item_name" className="label-text">Item / Work (saari cheezein ek saath)</label>
          <input
            id="item_name"
            name="item_name"
            type="text"
            className="input-field"
            value={form.item_name}
            onChange={handleChange}
            placeholder="Battery + Screen + Back Glass"
          />
          <p className="mt-1 text-xs text-slate-500">Example: 3 cheezein ho to teeno naam + se likho</p>
          {errors.item_name && <p className="mt-1 text-sm text-red-600">{errors.item_name}</p>}
        </div>

        <div>
          <label htmlFor="customer_name" className="label-text">Customer Name</label>
          <input id="customer_name" name="customer_name" type="text" className="input-field" value={form.customer_name} onChange={handleChange} placeholder="Ankur Gao" />
          {errors.customer_name && <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>}
        </div>

        <div>
          <label htmlFor="customer_amount" className="label-text">Customer Amount (total)</label>
          <input id="customer_amount" name="customer_amount" type="number" min="0" step="0.01" className="input-field" value={form.customer_amount} onChange={handleChange} placeholder="490" />
          {errors.customer_amount && <p className="mt-1 text-sm text-red-600">{errors.customer_amount}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={useBreakdown}
              onChange={(e) => setUseBreakdown(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-800">Multiple items — alag alag cost likhni hai</span>
          </label>
        </div>

        {useBreakdown ? (
          <CostBreakdownFields items={costItems} onChange={setCostItems} errors={errors} />
        ) : (
          <div>
            <label htmlFor="purchase_cost" className="label-text">Purchase Cost (total)</label>
            <input id="purchase_cost" name="purchase_cost" type="number" min="0" step="0.01" className="input-field" value={form.purchase_cost} onChange={handleChange} placeholder="20" />
            {errors.purchase_cost && <p className="mt-1 text-sm text-red-600">{errors.purchase_cost}</p>}
          </div>
        )}

        {useBreakdown && (
          <div>
            <label className="label-text">Total Purchase Cost</label>
            <input type="text" className="input-field bg-slate-100" value={formatCurrency(purchaseCost)} readOnly />
          </div>
        )}

        <div>
          <label htmlFor="source_shop" className="label-text">Purchased From</label>
          <input id="source_shop" name="source_shop" type="text" className="input-field" value={form.source_shop} onChange={handleChange} placeholder="V.M" />
          {errors.source_shop && <p className="mt-1 text-sm text-red-600">{errors.source_shop}</p>}
        </div>

        <div>
          <label htmlFor="profit" className="label-text">Total Profit</label>
          <input id="profit" type="text" className="input-field bg-slate-100" value={formatProfitLabel(profit)} readOnly />
        </div>

        {message && <AlertMessage message={message} />}
        {success && <AlertMessage type="success" message={success} />}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
