export function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL', digits: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return formatCurrency(0, currency, digits);
  }
  
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function formatCurrencyWithColor(value: number): string {
  const formattedValue = formatCurrency(value, 'BRL');
  if (value > 0) return `<span class="text-positive font-semibold">${formattedValue}</span>`;
  if (value < 0) return `<span class="text-negative font-semibold">${formattedValue}</span>`;
  return `<span>${formattedValue}</span>`;
}

export function parseCurrencyInput(value: string): number {
  const sanitized = value.replace(/\./g, '').replace(',', '.');
  const numeric = parseFloat(sanitized);
  return isNaN(numeric) ? 0 : numeric;
}

export function formatCurrencyInput(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
