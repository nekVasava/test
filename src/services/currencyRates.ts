import { getSavedCustomRates, saveCustomRates } from '../utils/storage';

export const RATES_REFERENCE_DATE = '2026-10-01 (ECB Reference / Offline Baseline)';

// Baseline rates against 1 USD
export const DEFAULT_CURRENCY_RATES: Record<string, { name: string; symbol: string; rate: number }> = {
  USD: { name: 'US Dollar', symbol: '$', rate: 1.0 },
  EUR: { name: 'Euro', symbol: '€', rate: 0.92 },
  GBP: { name: 'British Pound', symbol: '£', rate: 0.79 },
  INR: { name: 'Indian Rupee', symbol: '₹', rate: 83.5 },
  JPY: { name: 'Japanese Yen', symbol: '¥', rate: 152.4 },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$', rate: 1.37 },
  AUD: { name: 'Australian Dollar', symbol: 'AU$', rate: 1.52 },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', rate: 0.89 },
  CNY: { name: 'Chinese Yuan', symbol: '¥', rate: 7.23 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', rate: 1.34 },
  AED: { name: 'UAE Dirham', symbol: 'AED', rate: 3.67 },
  BRL: { name: 'Brazilian Real', symbol: 'R$', rate: 5.45 },
};

export function getActiveCurrencyRates(): Record<string, number> {
  const custom = getSavedCustomRates();
  const rates: Record<string, number> = {};

  Object.entries(DEFAULT_CURRENCY_RATES).forEach(([code, data]) => {
    rates[code] = custom && typeof custom[code] === 'number' && custom[code] > 0 ? custom[code] : data.rate;
  });

  return rates;
}

export function updateCustomCurrencyRate(code: string, newRate: number): boolean {
  if (!Number.isFinite(newRate) || newRate <= 0) return false;
  const current = getActiveCurrencyRates();
  current[code] = newRate;
  const res = saveCustomRates(current);
  return res.success;
}

export function resetCustomCurrencyRates(): void {
  const defaults: Record<string, number> = {};
  Object.entries(DEFAULT_CURRENCY_RATES).forEach(([code, data]) => {
    defaults[code] = data.rate;
  });
  saveCustomRates(defaults);
}
