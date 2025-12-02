import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL', digits: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) return formatCurrency(0, currency, digits);
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatCurrencyWithColor(value: number): string {
  const formattedValue = formatCurrency(value, 'BRL');
  if (value > 0) return `<span class="text-positive font-semibold">${formattedValue}</span>`;
  if (value < 0) return `<span class="text-negative font-semibold">${formattedValue}</span>`;
  return `<span>${formattedValue}</span>`;
}

export async function fetchBcbRateForDate(
  isoDate: string,
  ratesMapCompra: Map<string, number>,
  ratesMapVenda: Map<string, number>
): Promise<void> {
  if (ratesMapCompra.has(isoDate)) return;

  let searchDate = new Date(`${isoDate}T12:00:00Z`);
  for (let i = 0; i < 7; i++) {
    const currentIsoDate = searchDate.toISOString().split('T')[0];
    const [year, month, day] = currentIsoDate.split('-');
    const apiDate = `${month}-${day}-${year}`;
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${apiDate}'&$format=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          searchDate.setUTCDate(searchDate.getUTCDate() - 1);
          continue;
        }
        throw new Error(`Erro na API do BCB. Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.value && data.value.length > 0) {
        const item = data.value[0];
        ratesMapCompra.set(isoDate, item.cotacaoCompra);
        ratesMapVenda.set(isoDate, item.cotacaoVenda);
        return;
      } else {
        searchDate.setUTCDate(searchDate.getUTCDate() - 1);
      }
    } catch (error) {
      console.error(`Falha ao buscar cotações do BCB para ${apiDate}:`, error);
      throw error;
    }
  }
  console.warn(`Nenhuma cotação encontrada no BCB para a data ${isoDate} ou nos 6 dias anteriores.`);
}
