export function filterEntries(entries = [], query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return entries;

  return entries.filter((entry) => {
    const haystack = [
      entry.item_name,
      entry.customer_name,
      entry.source_shop,
      entry.created_by_name,
      entry.settled_by_name,
      entry.settlement_status,
      entry.entry_date,
      String(entry.customer_amount),
      String(entry.purchase_cost),
      String(entry.profit),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}
