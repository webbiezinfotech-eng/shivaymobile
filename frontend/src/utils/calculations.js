export function calculateProfit(customerAmount, purchaseCost) {
  const customer = parseFloat(customerAmount) || 0;
  const cost = parseFloat(purchaseCost) || 0;
  return Math.round((customer - cost) * 100) / 100;
}
