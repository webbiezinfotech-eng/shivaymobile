import { getTodayDateInputValue } from './formatters';

export function sumCostItems(items = []) {
  return Math.round(
    items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) * 100
  ) / 100;
}

export function validateEntryForm(form, costItems = [], useBreakdown = false, options = {}) {
  const errors = {};
  const allowFutureDate = options.allowFutureDate === true;

  if (!form.entry_date) errors.entry_date = 'Date is required.';
  else if (!allowFutureDate && form.entry_date > getTodayDateInputValue()) {
    errors.entry_date = 'Future date entries are not allowed.';
  }
  if (!form.item_name?.trim()) errors.item_name = 'Item / Work is required.';
  if (!form.customer_name?.trim()) errors.customer_name = 'Customer name is required.';
  if (!form.source_shop?.trim()) errors.source_shop = 'Purchased from is required.';

  if (form.customer_amount === '' || form.customer_amount === null) {
    errors.customer_amount = 'Customer amount is required.';
  } else if (Number(form.customer_amount) < 0) {
    errors.customer_amount = 'Customer amount cannot be negative.';
  }

  if (useBreakdown) {
    const validRows = costItems.filter((item) => item.cost !== '' && Number(item.cost) > 0);
    if (validRows.length === 0) {
      errors.cost_items = 'Kam se kam ek item ki cost likho.';
    }
  } else if (form.purchase_cost === '' || form.purchase_cost === null) {
    errors.purchase_cost = 'Purchase cost is required.';
  } else if (Number(form.purchase_cost) < 0) {
    errors.purchase_cost = 'Purchase cost cannot be negative.';
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = {};
  if (!form.username?.trim()) errors.username = 'Username is required.';
  if (!form.password) errors.password = 'Password is required.';
  return errors;
}
