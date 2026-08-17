import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import BackButton from '../../components/common/BackButton';
import AlertMessage from '../../components/common/AlertMessage';
import NamePickerInput from '../../components/common/NamePickerInput';
import CostBreakdownFields from '../../components/entries/CostBreakdownFields';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { calculateProfit } from '../../utils/calculations';
import { formatCurrency, formatProfitLabel, getTodayDateInputValue } from '../../utils/formatters';
import { sumCostItems, validateEntryForm } from '../../utils/validation';
import { getEntryDetails, updateEntry } from '../../services/entryService';
import { useEntrySuggestions } from '../../utils/useEntrySuggestions';
import { ApiError } from '../../services/api';

export default function EditEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, sources } = useEntrySuggestions();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    entry_date: '',
    item_name: '',
    customer_name: '',
    customer_amount: '',
    purchase_cost: '',
    source_shop: '',
  });
  const [useBreakdown, setUseBreakdown] = useState(false);
  const [costItems, setCostItems] = useState([{ name: '', cost: '' }]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getEntryDetails(id)
      .then((entry) => {
        setForm({
          entry_date: entry.entry_date,
          item_name: entry.item_name,
          customer_name: entry.customer_name,
          customer_amount: String(entry.customer_amount),
          purchase_cost: String(entry.purchase_cost),
          source_shop: entry.source_shop,
        });
        if (entry.cost_breakdown?.length) {
          setUseBreakdown(true);
          setCostItems(
            entry.cost_breakdown.map((item) => ({
              name: item.name || '',
              cost: String(item.cost),
            }))
          );
        }
      })
      .catch((err) => {
        setMessage(err instanceof ApiError ? err.message : 'Unable to load entry.');
      })
      .finally(() => setLoading(false));
  }, [id]);

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

    const validationErrors = validateEntryForm(form, costItems, useBreakdown, { allowFutureDate: true });
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setMessage('');
    setSuccess('');

    const payload = {
      entry_id: Number(id),
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
      await updateEntry(payload);
      setSuccess('Entry updated successfully.');
      setTimeout(() => navigate(`/owner/entries/${id}`), 1000);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        if (error.errors) setErrors(error.errors);
      } else {
        setMessage('Unable to update entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Edit Entry" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      <BackButton fallback={`/owner/entries/${id}`} label="← Back to Entry" />

      {loading && <LoadingSpinner />}

      {!loading && (
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-xl font-bold text-slate-900">Edit Entry</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="entry_date" className="label-text">Date</label>
              <input id="entry_date" name="entry_date" type="date" className="input-field" value={form.entry_date} max={getTodayDateInputValue()} onChange={handleChange} />
              {errors.entry_date && <p className="mt-1 text-sm text-red-600">{errors.entry_date}</p>}
            </div>

            <div>
              <label htmlFor="item_name" className="label-text">Item / Work</label>
              <input id="item_name" name="item_name" type="text" className="input-field" value={form.item_name} onChange={handleChange} />
              {errors.item_name && <p className="mt-1 text-sm text-red-600">{errors.item_name}</p>}
            </div>

            <NamePickerInput
              id="customer_name"
              name="customer_name"
              label="Customer Name"
              value={form.customer_name}
              onChange={handleChange}
              suggestions={customers}
              storageKey="customer"
              error={errors.customer_name}
            />

            <div>
              <label htmlFor="customer_amount" className="label-text">Customer Amount</label>
              <input id="customer_amount" name="customer_amount" type="number" min="0" step="0.01" className="input-field" value={form.customer_amount} onChange={handleChange} />
              {errors.customer_amount && <p className="mt-1 text-sm text-red-600">{errors.customer_amount}</p>}
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={useBreakdown} onChange={(e) => setUseBreakdown(e.target.checked)} className="h-5 w-5 rounded border-slate-300" />
                <span className="text-sm font-medium text-slate-800">Multiple items — alag alag cost</span>
              </label>
            </div>

            {useBreakdown ? (
              <CostBreakdownFields items={costItems} onChange={setCostItems} errors={errors} />
            ) : (
              <div>
                <label htmlFor="purchase_cost" className="label-text">Purchase Cost</label>
                <input id="purchase_cost" name="purchase_cost" type="number" min="0" step="0.01" className="input-field" value={form.purchase_cost} onChange={handleChange} />
                {errors.purchase_cost && <p className="mt-1 text-sm text-red-600">{errors.purchase_cost}</p>}
              </div>
            )}

            {useBreakdown && (
              <div>
                <label className="label-text">Total Purchase Cost</label>
                <input type="text" className="input-field bg-slate-100" value={formatCurrency(purchaseCost)} readOnly />
              </div>
            )}

            <NamePickerInput
              id="source_shop"
              name="source_shop"
              label="Purchased From"
              value={form.source_shop}
              onChange={handleChange}
              suggestions={sources}
              storageKey="source"
              error={errors.source_shop}
            />

            <div>
              <label htmlFor="profit" className="label-text">Total Profit</label>
              <input id="profit" type="text" className="input-field bg-slate-100" value={formatProfitLabel(profit)} readOnly />
            </div>

            {message && <AlertMessage message={message} />}
            {success && <AlertMessage type="success" message={success} />}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
