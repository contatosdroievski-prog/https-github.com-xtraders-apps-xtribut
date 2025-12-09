// API do Banco Central do Brasil para cotações
const ratesMapVenda = new Map<string, number>();
const ratesMapCompra = new Map<string, number>();

export async function fetchBcbRateForDate(isoDate: string): Promise<void> {
  if (ratesMapCompra.has(isoDate)) {
    return; // Já temos a cotação
  }

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

export function getRateForDate(date: Date, transType: 'Envio' | 'Retirada' | 'Não Retirada'): number | null {
  const isoDate = date.toISOString().split('T')[0];
  const ratesMap = transType === 'Envio' ? ratesMapVenda : ratesMapCompra;
  return ratesMap.get(isoDate) || null;
}

export function getRatesMapCompra(): Map<string, number> {
  return ratesMapCompra;
}

export function clearRatesCache(): void {
  ratesMapVenda.clear();
  ratesMapCompra.clear();
}

// Pre-populate rates cache from stored transaction data
export function prePopulateRatesCache(transactions: { date: string | Date; type: string; cotacao?: number }[]): void {
  for (const trans of transactions) {
    if (!trans.cotacao) continue;

    const dateStr = trans.date instanceof Date
      ? trans.date.toISOString().split('T')[0]
      : new Date(trans.date).toISOString().split('T')[0];

    // Envio uses Venda rate, Retirada/Não Retirada uses Compra rate
    if (trans.type === 'Envio') {
      if (!ratesMapVenda.has(dateStr)) {
        ratesMapVenda.set(dateStr, trans.cotacao);
      }
    } else {
      if (!ratesMapCompra.has(dateStr)) {
        ratesMapCompra.set(dateStr, trans.cotacao);
      }
    }
  }
}
