import { useMemo, useState } from 'react';
import { useApp } from '../../lib/context/AppContext';
import { Card } from '../ui/card';
import { formatCurrency } from '../../lib/utils/currency';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { processAndRenderCambial, ProcessedRow, CambialKpi } from '../../lib/calculations/cambial';
import { apurarImposto, IrKpiData, MonthlyResult, ProcessedTrade } from '../../lib/calculations/ir';
import { getRatesMapCompra, getRateForDate } from '../../lib/api/bcb';
import { Transaction } from '../../lib/types';

interface YearData {
    year: string;
    cambial: {
        processed: ProcessedRow[];
        kpi: CambialKpi;
    };
    ir: {
        monthly: MonthlyResult[];
        kpi: IrKpiData;
        processedTrades: ProcessedTrade[];
    } | null;
}

export function HistoryTab() {
    const { processedTrades, withdrawals } = useApp();
    const [expandedYear, setExpandedYear] = useState<string | null>(null);

    const historyData = useMemo(() => {
        const years = new Set<string>();

        // Collect years from trades
        processedTrades.forEach(t => {
            if (t.mes_ano) years.add(t.mes_ano.split('-')[0]);
        });

        // Collect years from withdrawals
        withdrawals.forEach(w => {
            const dateStr = w.date instanceof Date ? w.date.toISOString() : w.date;
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                years.add(date.getFullYear().toString());
            }
        });

        const sortedYears = Array.from(years).sort().reverse();

        return sortedYears.map(year => {
            // 1. Process Cambial Data for this year
            // Filter withdrawals for this year AND previous years to calculate correct balance/average price
            // Actually, Cambial calculation needs full history to be correct (average price depends on past).
            // So we process ALL transactions, then filter the RESULTS for this year.

            const allTransactions: Transaction[] = withdrawals.map(w => ({
                ...w,
                date: new Date(w.date instanceof Date ? w.date.toISOString() : w.date)
            })).sort((a, b) => a.date.getTime() - b.date.getTime());

            // We need to fetch rates for all dates if not already fetched. 
            // Assuming they are fetched or we might have issues. 
            // Ideally we should ensure rates are available. 
            // For now, we try to run processAndRenderCambial. 
            // If it fails due to missing rates, we might need a way to handle it.

            let cambialData: { processed: ProcessedRow[], kpi: CambialKpi } = {
                processed: [],
                kpi: {
                    saldoUSD: 0, custoSaldoBRL: 0, totalEnviosUSD: 0, totalRetiradoUSD: 0,
                    totalEnviosBRL: 0, totalRetiradoBRL: 0, lucroPrejuizoTotal: 0,
                    lucroTributavel: 0, impostoDevido: 0, valorNaoRetiradaBRL: null,
                    mostrarAlocarCard: false, saldoFinalParaExibir: 0
                }
            };

            try {
                // We run calculation for ALL history to get correct state
                const fullCambial = processAndRenderCambial(allTransactions);

                // Filter for current year
                const yearProcessed = fullCambial.processed.filter(r => r.date.getFullYear().toString() === year);

                // KPI for specific year is tricky. 
                // Some KPIs are cumulative (Saldo), others are flow (Total Envios).
                // Let's calculate flow KPIs for this year.
                const yearEnviosUSD = yearProcessed.filter(r => r.type === 'Envio').reduce((s, r) => s + r.valueUSD, 0);
                const yearRetiradasUSD = yearProcessed.filter(r => r.type === 'Retirada').reduce((s, r) => s + r.valueUSD, 0);
                const yearLucro = yearProcessed.reduce((s, r) => s + r.lucroPrejuizo, 0);
                const yearImposto = yearProcessed.filter(r => r.type === 'Retirada' && r.lucroPrejuizo > 0).reduce((s, r) => s + r.lucroPrejuizo, 0) * 0.15;

                cambialData = {
                    processed: yearProcessed,
                    kpi: {
                        ...fullCambial.kpi, // Keep cumulative stats? Or maybe just show year stats?
                        // Let's override flow stats for the year view
                        totalEnviosUSD: yearEnviosUSD,
                        totalRetiradoUSD: yearRetiradasUSD,
                        lucroPrejuizoTotal: yearLucro,
                        impostoDevido: yearImposto
                    }
                };
            } catch (e) {
                console.error("Error calculating cambial for history", e);
            }

            // 2. Process IR Data for this year
            let irData = null;
            const yearTrades = processedTrades.filter(t => t.mes_ano.startsWith(year));

            if (yearTrades.length > 0) {
                // We need to re-calculate IR for this specific year to get the monthly breakdown object
                // processedTrades already has results, but we want the aggregated monthly object
                // We can reconstruct it from processedTrades

                const monthlyGroups = yearTrades.reduce((acc: any, trade) => {
                    const month = trade.mes_ano;
                    if (!acc[month]) {
                        acc[month] = { r_brl: 0, r_usd: 0 };
                    }
                    acc[month].r_brl += trade.resultado_liquido_brl;
                    acc[month].r_usd += trade.resultado_liquido_usd;
                    return acc;
                }, {});

                const monthly = Object.keys(monthlyGroups).sort().map(month => ({
                    mes: month,
                    resultado_liquido_brl: monthlyGroups[month].r_brl,
                    resultado_liquido_usd: monthlyGroups[month].r_usd
                }));

                const totalBRL = yearTrades.reduce((s, t) => s + t.resultado_liquido_brl, 0);
                const totalUSD = yearTrades.reduce((s, t) => s + t.resultado_liquido_usd, 0);
                const impostoAnual = totalBRL > 0 ? totalBRL * 0.15 : 0;

                irData = {
                    monthly,
                    processedTrades: yearTrades,
                    kpi: {
                        totalUSD,
                        totalBRL,
                        impostoAnual,
                        resultadoAposDarf: totalBRL - impostoAnual
                    }
                };
            }

            return {
                year,
                cambial: cambialData,
                ir: irData
            };
        });
    }, [processedTrades, withdrawals]);

    const toggleYear = (year: string) => {
        setExpandedYear(expandedYear === year ? null : year);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <Card className="glass-card p-6">
                <h2 className="text-2xl mb-6 text-left font-['Sora',sans-serif] font-bold">Histórico Anual Detalhado</h2>

                <div className="space-y-4">
                    {historyData.length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            Nenhum dado encontrado. Importe seus trades e registre suas movimentações.
                        </div>
                    ) : (
                        historyData.map((data) => (
                            <Card key={data.year} className="glass-card overflow-hidden border border-border/50">
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => toggleYear(data.year)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl font-bold text-[#D4AF37]">{data.year}</span>
                                        <div className="flex gap-4 text-sm text-muted">
                                            <span>Envios: {formatCurrency(data.cambial.kpi.totalEnviosUSD, 'USD')}</span>
                                            <span>|</span>
                                            <span>Resultado Trades: {formatCurrency(data.ir?.kpi.totalUSD || 0, 'USD')}</span>
                                        </div>
                                    </div>
                                    {expandedYear === data.year ? <ChevronUp /> : <ChevronDown />}
                                </div>

                                {expandedYear === data.year && (
                                    <div className="p-4 border-t border-border/50 bg-black/20">

                                        {/* Seção Cambial */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold mb-4 text-[#D4AF37]">Relatório Cambial (Envios e Retiradas)</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="p-3 bg-card/50 rounded border border-border">
                                                    <p className="text-xs text-muted uppercase">Total Envios</p>
                                                    <p className="text-lg font-medium">{formatCurrency(data.cambial.kpi.totalEnviosUSD, 'USD')}</p>
                                                </div>
                                                <div className="p-3 bg-card/50 rounded border border-border">
                                                    <p className="text-xs text-muted uppercase">Total Retiradas</p>
                                                    <p className="text-lg font-medium">{formatCurrency(data.cambial.kpi.totalRetiradoUSD, 'USD')}</p>
                                                </div>
                                                <div className="p-3 bg-card/50 rounded border border-border">
                                                    <p className="text-xs text-muted uppercase">Lucro/Prejuízo Cambial</p>
                                                    <p className={`text-lg font-medium ${data.cambial.kpi.lucroPrejuizoTotal >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                        {formatCurrency(data.cambial.kpi.lucroPrejuizoTotal)}
                                                    </p>
                                                </div>
                                            </div>

                                            {data.cambial.processed.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Data</TableHead>
                                                                <TableHead>Tipo</TableHead>
                                                                <TableHead>Valor (USD)</TableHead>
                                                                <TableHead>Cotação</TableHead>
                                                                <TableHead>Valor (BRL)</TableHead>
                                                                <TableHead>L/P (BRL)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {data.cambial.processed.map((row, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>{row.date.toLocaleDateString('pt-BR')}</TableCell>
                                                                    <TableCell>{row.type}</TableCell>
                                                                    <TableCell>{formatCurrency(row.valueUSD, 'USD')}</TableCell>
                                                                    <TableCell>{formatCurrency(row.cotacao)}</TableCell>
                                                                    <TableCell>{formatCurrency(row.valueBRL)}</TableCell>
                                                                    <TableCell className={row.lucroPrejuizo >= 0 ? 'text-positive' : 'text-negative'}>
                                                                        {formatCurrency(row.lucroPrejuizo)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted italic">Nenhuma movimentação cambial neste ano.</p>
                                            )}
                                        </div>

                                        {/* Seção IR */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 text-[#D4AF37]">Relatório de Performance (IR)</h3>
                                            {data.ir ? (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                        <div className="p-3 bg-card/50 rounded border border-border">
                                                            <p className="text-xs text-muted uppercase">Resultado (USD)</p>
                                                            <p className={`text-lg font-medium ${data.ir.kpi.totalUSD >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                                {formatCurrency(data.ir.kpi.totalUSD, 'USD')}
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-card/50 rounded border border-border">
                                                            <p className="text-xs text-muted uppercase">Resultado (BRL)</p>
                                                            <p className={`text-lg font-medium ${data.ir.kpi.totalBRL >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                                {formatCurrency(data.ir.kpi.totalBRL)}
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-card/50 rounded border border-border">
                                                            <p className="text-xs text-muted uppercase">Imposto Devido</p>
                                                            <p className="text-lg font-medium">{formatCurrency(data.ir.kpi.impostoAnual)}</p>
                                                        </div>
                                                        <div className="p-3 bg-card/50 rounded border border-border">
                                                            <p className="text-xs text-muted uppercase">Resultado Líquido</p>
                                                            <p className={`text-lg font-medium ${data.ir.kpi.resultadoAposDarf >= 0 ? 'text-positive' : 'text-negative'}`}>
                                                                {formatCurrency(data.ir.kpi.resultadoAposDarf)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Mês</TableHead>
                                                                    <TableHead>Resultado (USD)</TableHead>
                                                                    <TableHead>Resultado (BRL)</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {data.ir.monthly.map((m, idx) => (
                                                                    <TableRow key={idx}>
                                                                        <TableCell>{m.mes}</TableCell>
                                                                        <TableCell className={m.resultado_liquido_usd >= 0 ? 'text-positive' : 'text-negative'}>
                                                                            {formatCurrency(m.resultado_liquido_usd, 'USD')}
                                                                        </TableCell>
                                                                        <TableCell className={m.resultado_liquido_brl >= 0 ? 'text-positive' : 'text-negative'}>
                                                                            {formatCurrency(m.resultado_liquido_brl)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted italic">Nenhum trade registrado neste ano.</p>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
