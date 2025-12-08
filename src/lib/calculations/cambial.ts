import { Transaction } from '../types';
import { getRateForDate } from '../api/bcb';
import { formatCurrency } from '../utils/currency';

export interface ProcessedRow {
    date: Date;
    type: string;
    valueUSD: number;
    cotacao: number;
    valueBRL: number;
    lucroPrejuizo: number;
    saldoFinal: number;
}

export interface CambialKpi {
    saldoUSD: number;
    custoSaldoBRL: number;
    totalEnviosUSD: number;
    totalRetiradoUSD: number;
    totalEnviosBRL: number;
    totalRetiradoBRL: number;
    lucroPrejuizoTotal: number;
    lucroTributavel: number;
    impostoDevido: number;
    valorNaoRetiradaBRL: number | null;
    mostrarAlocarCard: boolean;
    saldoFinalParaExibir: number;
}

export function processAndRenderCambial(transactions: Transaction[]): { processed: ProcessedRow[], kpi: CambialKpi } {
    let saldoUSD = 0;
    let custoSaldoBRL = 0;
    let totalEnviosUSD = 0;
    let totalRetiradoUSD = 0;
    let lucroPrejuizoTotal = 0;
    let totalEnviosBRL = 0;
    let totalRetiradoBRL = 0;
    let lucroTributavel = 0;
    let valorNaoRetiradaBRL: number | null = null;
    let mostrarAlocarCard = false;

    const processed: ProcessedRow[] = [];

    for (const trans of transactions) {
        const cotacaoDia = getRateForDate(trans.date, trans.type);
        if (cotacaoDia === null) {
            throw new Error(`Cotação não encontrada para a data ${trans.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}. Verifique sua conexão e tente novamente.`);
        }

        const valorDeMercadoBRL = trans.value * cotacaoDia;
        const precoMedioAnterior = saldoUSD > 1e-6 ? custoSaldoBRL / saldoUSD : 0;
        let custoOperacaoBRL = 0;
        let lucroPrejuizoRow = 0;

        if (trans.type === 'Envio') {
            saldoUSD += trans.value;
            custoSaldoBRL += valorDeMercadoBRL;
            totalEnviosUSD += trans.value;
            totalEnviosBRL += valorDeMercadoBRL;
        } else {
            // Retirada ou Não Retirada
            if (trans.value > saldoUSD) {
                throw new Error(`Saque (${formatCurrency(trans.value, 'USD')}) maior que o saldo na data.`);
            }

            custoOperacaoBRL = trans.value * precoMedioAnterior;
            lucroPrejuizoRow = valorDeMercadoBRL - custoOperacaoBRL;
            lucroPrejuizoTotal += lucroPrejuizoRow;

            if (trans.type === 'Retirada' && lucroPrejuizoRow > 0) {
                lucroTributavel += lucroPrejuizoRow;
            }

            if (trans.type === 'Não Retirada') {
                custoSaldoBRL += (2 * lucroPrejuizoRow);
                valorNaoRetiradaBRL = valorDeMercadoBRL;
                if (trans.date.getUTCMonth() === 11 && trans.date.getUTCDate() === 31) {
                    mostrarAlocarCard = true;
                }
            } else {
                // Retirada normal
                totalRetiradoUSD += trans.value;
                totalRetiradoBRL += valorDeMercadoBRL;
                saldoUSD -= trans.value;
                custoSaldoBRL -= custoOperacaoBRL;
            }
        }

        processed.push({
            date: trans.date,
            type: trans.type,
            valueUSD: trans.value,
            cotacao: cotacaoDia,
            valueBRL: valorDeMercadoBRL,
            lucroPrejuizo: lucroPrejuizoRow,
            saldoFinal: saldoUSD
        });
    }

    const impostoDevido = lucroTributavel * 0.15;
    const saldoBRLCalculado = custoSaldoBRL + lucroPrejuizoTotal;
    const saldoFinalParaExibir = valorNaoRetiradaBRL !== null ? valorNaoRetiradaBRL : (saldoUSD < 1e-6 ? 0 : saldoBRLCalculado);

    return {
        processed,
        kpi: {
            saldoUSD,
            custoSaldoBRL,
            totalEnviosUSD,
            totalRetiradoUSD,
            totalEnviosBRL,
            totalRetiradoBRL,
            lucroPrejuizoTotal,
            lucroTributavel,
            impostoDevido,
            valorNaoRetiradaBRL,
            mostrarAlocarCard,
            saldoFinalParaExibir
        }
    };
}
