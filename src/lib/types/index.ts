export interface Transaction {
  id: string;
  date: Date;
  type: 'Envio' | 'Retirada' | 'Não Retirada';
  value: number;
  cotacao?: number; // Exchange rate at transaction time
}

export interface ProcessedTransaction extends Omit<Transaction, 'cotacao'> {
  cotacao: number;
  valorBRL: number;
  lucroPrejuizo: number;
  saldoFinal: number;
}

export interface CambialKpiData {
  saldoUSD: number;
  custoSaldoBRL: number;
  totalEnviosUSD: number;
  totalRetiradoUSD: number;
  totalEnviosBRL: number;
  totalRetiradoBRL: number;
  lucroPrejuizoTotal: number;
  lucroTributavel: number;
  impostoDevido: number;
}

export interface Trade {
  data_iso: string;
  mes_ano: string;
  ativo: string;
  resultado_liquido_usd: number;
  resultado_liquido_brl: number;
  data_fechamento?: string;
  resultado?: string;
  comissao?: string;
  swap?: string;
  [key: string]: any;
}

export interface MonthlyResult {
  mes: string;
  resultado_liquido_usd: number;
  resultado_liquido_brl: number;
}

export interface IrKpiData {
  totalUSD: number;
  totalBRL: number;
  impostoAnual: number;
  resultadoAposDarf: number;
}

export interface PlatformInfo {
  name: string;
  map: {
    data_fechamento: string;
    resultado: string;
    comissao: string;
    swap: string;
    ativo: string;
  };
}
