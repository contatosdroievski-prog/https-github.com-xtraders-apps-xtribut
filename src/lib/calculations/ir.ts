export interface ProcessedTrade {
    data_iso: string;
    mes_ano: string;
    resultado_liquido_usd: number;
    resultado_liquido_brl: number;
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

export function identifyPlatform(data: any[]): PlatformInfo | null {
    if (!data || data.length === 0) {
        throw new Error("O arquivo de operações está vazio.");
    }

    const columns = new Set(Object.keys(data[0]).map(c => c.toLowerCase().trim().replace(/\s+/g, ' ')));

    if (columns.has('position') && columns.has('ativo') && columns.has('horário') && columns.has('lucro')) {
        return {
            name: 'Metatrader 5 (Posições)',
            map: {
                data_fechamento: 'Horário',
                resultado: 'Lucro',
                comissao: 'Comissão',
                swap: 'Swap',
                ativo: 'Ativo'
            }
        };
    }

    if (columns.has('n. do trade') && columns.has('datade fechamento')) {
        return {
            name: 'Metatrader 5 (Negócios)',
            map: {
                data_fechamento: 'Datade  Fechamento',
                resultado: 'Resultado',
                comissao: 'Comissão',
                swap: 'Swap',
                ativo: 'Ativo'
            }
        };
    }

    if (columns.has('position') && columns.has('type') && columns.has('deal')) {
        return {
            name: 'Metatrader 5 (Inglês)',
            map: {
                data_fechamento: 'Time',
                resultado: 'Profit',
                comissao: 'Commission',
                swap: 'Swap',
                ativo: 'Symbol'
            }
        };
    }

    if (columns.has('ticket') && columns.has('open time') && columns.has('close time')) {
        return {
            name: 'Metatrader 4',
            map: {
                data_fechamento: 'Close Time',
                resultado: 'Profit',
                comissao: 'Commission',
                swap: 'Swap',
                ativo: 'Item'
            }
        };
    }

    if (columns.has('tradeid') && columns.has('direction') && columns.has('close time')) {
        return {
            name: 'CTrader',
            map: {
                data_fechamento: 'Close Time',
                resultado: 'Net Profit',
                comissao: 'Commissions',
                swap: 'Swap',
                ativo: 'Symbol'
            }
        };
    }

    return null;
}

export function apurarImposto(trades: any[], quotesMap: Map<string, number>): {
    monthly: MonthlyResult[];
    platform: string;
    processedTrades: ProcessedTrade[];
    impostoAnual: number;
    kpi: IrKpiData;
} {
    const platformInfo = identifyPlatform(trades);
    if (!platformInfo) {
        throw new Error("Plataforma de trading não identificada.");
    }

    const normalize = (obj: any, map: any) => {
        const newObj: any = {};
        for (const key in obj) {
            const nKey = key.toLowerCase().trim().replace(/\s+/g, ' ');
            const sKey = Object.keys(map).find(k => map[k].toLowerCase().trim().replace(/\s+/g, ' ') === nKey);
            if (sKey) {
                newObj[sKey] = obj[key];
            } else {
                newObj[key.toLowerCase().trim().replace(/\s+/g, '_')] = obj[key];
            }
        }
        return newObj;
    };

    let processedTrades = trades.map(t => normalize(t, platformInfo.map));

    if (quotesMap.size === 0) {
        throw new Error("O mapa de cotações está vazio.");
    }

    processedTrades = processedTrades.map(trade => {
        const parseCurrency = (v: any) => parseFloat(String(v || '0').replace(/\s/g, '').replace(',', '.')) || 0;
        const resultado_liquido_usd = parseCurrency(trade.resultado);

        let date: Date;
        const dateStr = (trade.data_fechamento || '').split(' ')[0];

        if (dateStr.includes('/')) {
            const p = dateStr.split('/');
            date = new Date(Date.UTC(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])));
        } else {
            date = new Date(dateStr.replace(/\./g, '-') + 'T00:00:00Z');
        }

        if (isNaN(date.getTime())) {
            throw new Error(`Data inválida: ${trade.data_fechamento}`);
        }

        const isoDate = date.toISOString().split('T')[0];
        const quote = quotesMap.get(isoDate);
        const resultado_liquido_brl = quote ? resultado_liquido_usd * quote : 0;

        return {
            ...trade,
            data_iso: isoDate,
            mes_ano: isoDate ? isoDate.substring(0, 7) : null,
            resultado_liquido_usd,
            resultado_liquido_brl
        };
    }).filter(t => t.mes_ano);

    const monthlyGroups = processedTrades.reduce((acc: any, trade) => {
        const month = trade.mes_ano;
        if (!acc[month]) {
            acc[month] = { r_brl: 0, r_usd: 0 };
        }
        acc[month].r_brl += trade.resultado_liquido_brl;
        acc[month].r_usd += trade.resultado_liquido_usd;
        return acc;
    }, {});

    const apuracaoMensal = Object.keys(monthlyGroups).sort().map(month => ({
        mes: month,
        resultado_liquido_brl: monthlyGroups[month].r_brl,
        resultado_liquido_usd: monthlyGroups[month].r_usd
    }));

    const lucro_total_anual_brl = processedTrades.reduce((sum, trade) => sum + trade.resultado_liquido_brl, 0);
    const impostoAnual = lucro_total_anual_brl > 0 ? lucro_total_anual_brl * 0.15 : 0;

    const totalUSD = apuracaoMensal.reduce((s, r) => s + r.resultado_liquido_usd, 0);
    const totalBRL = apuracaoMensal.reduce((s, r) => s + r.resultado_liquido_brl, 0);
    const resultadoAposDarf = totalBRL - impostoAnual;

    return {
        monthly: apuracaoMensal,
        platform: platformInfo.name,
        processedTrades,
        impostoAnual,
        kpi: {
            totalUSD,
            totalBRL,
            impostoAnual,
            resultadoAposDarf
        }
    };
}
