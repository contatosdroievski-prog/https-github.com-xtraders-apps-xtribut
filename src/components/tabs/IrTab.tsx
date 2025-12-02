import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, AlertCircle, Download, X } from 'lucide-react';
import { fetchBcbRateForDate, getRatesMapCompra } from '../../lib/api/bcb';
import { formatCurrency } from '../../lib/utils/currency';
import { generateIrPdf } from '../../lib/utils/pdf-export';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useApp } from '../../lib/context/AppContext';
import { ExportModal } from '../ExportModal';
import { auth } from '../../lib/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ProcessedTrade {
  data_iso: string;
  mes_ano: string;
  resultado_liquido_usd: number;
  resultado_liquido_brl: number;
  [key: string]: any;
}

interface MonthlyResult {
  mes: string;
  resultado_liquido_usd: number;
  resultado_liquido_brl: number;
}

interface IrKpiData {
  totalUSD: number;
  totalBRL: number;
  impostoAnual: number;
  resultadoAposDarf: number;
}

interface PlatformInfo {
  name: string;
  map: {
    data_fechamento: string;
    resultado: string;
    comissao: string;
    swap: string;
    ativo: string;
  };
}

export function IrTab() {
  const { setProcessedTrades } = useApp();
  const [fileName, setFileName] = useState('Relatório de Operações (.csv)');
  const [tradesData, setTradesData] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    monthly: MonthlyResult[];
    platform: string;
    processedTrades: ProcessedTrade[];
    impostoAnual: number;
    kpi: IrKpiData;
  } | null>(null);
  const [modalMonth, setModalMonth] = useState<{
    mes: string;
    monthName: string;
    trades: ProcessedTrade[];
  } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        let dataRows = results.data as string[][];
        
        if (dataRows.length > 1 && dataRows[0][0] && dataRows[0][0].toLowerCase().includes('posi')) {
          dataRows.shift();
        }

        const headers = dataRows[0].map(h => h.trim());
        const records = dataRows.slice(1);

        const parsedData = records.map(row => {
          const obj: any = {};
          headers.forEach((header, i) => {
            if (header) obj[header] = row[i];
          });
          return obj;
        }).filter(row => Object.values(row).some(val => val !== null && val.toString().trim() !== ''));

        setTradesData(parsedData);
        toast.success('Arquivo carregado com sucesso!');
      },
      error: (error) => {
        toast.error(`Erro ao ler o arquivo: ${error.message}`);
      }
    });
  };

  const handleProcess = async () => {
    if (!tradesData) {
      toast.error('Por favor, carregue o arquivo de operações para continuar.');
      return;
    }

    setIsProcessing(true);
    try {
      const uniqueDates = [...new Set(tradesData.map(t => {
        const dateStr = (t['Horário'] || t['Datade  Fechamento'] || t['Time'] || t['Close Time'] || ' ').split(' ')[0];
        if (!dateStr) return null;
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        if (dateStr.includes('.')) {
          const [year, month, day] = dateStr.split('.');
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return new Date(dateStr + 'T00:00:00Z').toISOString().split('T')[0];
      }))].filter(d => d && !isNaN(new Date(d).getTime())) as string[];

      if (uniqueDates.length === 0) {
        throw new Error("Não foram encontradas datas válidas no arquivo de operações.");
      }

      await Promise.all(uniqueDates.map(date => fetchBcbRateForDate(date)));

      const result = apurarImposto(tradesData, getRatesMapCompra());
      
      setResults(result);
      setProcessedTrades(result.processedTrades);
      
      toast.success('Dados processados com sucesso!');
    } catch (error: any) {
      toast.error(`Ocorreu um erro no cálculo: ${error.message}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openTradesModal = (mes: string, monthName: string) => {
    if (!results) return;
    const trades = results.processedTrades.filter(t => t.mes_ano === mes);
    setModalMonth({ mes, monthName, trades });
  };

  const closeTradesModal = () => {
    setModalMonth(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="glass-card p-6">
        <h2 className="text-center mb-2">Apuração Anual de Resultados dos Trades</h2>
        <p className="text-center text-sm mb-6 text-muted">
          Importe a Planilha de Trades realizados para calcular seus resultados e impostos devidos.
        </p>

        <div className="flex justify-center mb-8">
          <label
            id="upload-csv-area"
            htmlFor="trades-file"
            data-tour="upload-csv"
            className="w-full md:w-1/1 flex flex-col justify-center items-center p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors"
          >
            <Upload className="w-12 h-12 text-muted mb-2" />
            <span className={`mt-2 text-sm font-semibold ${fileName !== 'Relatório de Operações (.csv)' ? 'text-accent' : 'text-foreground'}`}>
              {fileName}
            </span>
          </label>
          <input
            id="trades-file"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className="p-4 rounded-lg bg-black/20 border-l-4 border-[#D4AF37] mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            
              <div>
              <p className="font-semibold text-[#D4AF37]">MUITO IMPORTANTE:</p>
              <p className="mt-1 text-sm text-muted">Certifique-se de que o relatório está no formato CSV (separado por vírgula). Neste campo NÃO são considerados os envios e retiradas de capital (margem para operar).
              </p>
              
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={handleProcess}
            disabled={isProcessing || !tradesData}
            className="bg-gradient-to-r from-[#D4AF37] via-[#FFEE99] to-[#D4AF37] bg-[length:150%_auto] text-[#0D0D0D] hover:bg-[length:250%_auto] transition-all duration-500"
          >
            {isProcessing ? 'Processando...' : 'Processar Dados'}
          </Button>
        </div>
      </Card>

      {results && (
        <IrResultsWrapper 
          kpi={results.kpi} 
          monthly={results.monthly} 
          platform={results.platform}
          processedTrades={results.processedTrades}
          onMonthClick={openTradesModal}
          isExportModalOpen={isExportModalOpen}
          setIsExportModalOpen={setIsExportModalOpen}
        />
      )}

      {modalMonth && (
        <TradesModal 
          monthName={modalMonth.monthName}
          trades={modalMonth.trades}
          onClose={closeTradesModal}
        />
      )}
    </div>
  );
}

function identifyPlatform(data: any[]): PlatformInfo | null {
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

function apurarImposto(trades: any[], quotesMap: Map<string, number>): {
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

function IrResults({ 
  kpi, 
  monthly, 
  platform,
  onMonthClick,
  onExportClick
}: { 
  kpi: IrKpiData; 
  monthly: MonthlyResult[];
  platform: string;
  onMonthClick: (mes: string, monthName: string) => void;
  onExportClick: () => void;
}) {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const chartData = {
    labels: monthly.map(r => {
      const monthIndex = parseInt(r.mes.split('-')[1]) - 1;
      const year = r.mes.split('-')[0];
      return `${monthNames[monthIndex].substring(0, 3)}/${year.substring(2, 4)}`;
    }),
    datasets: [{
      label: 'Resultado (BRL)',
      data: monthly.map(r => r.resultado_liquido_brl),
      backgroundColor: monthly.map(r => r.resultado_liquido_brl >= 0 ? '#0aff39' : '#ff0a0a'),
      borderColor: monthly.map(r => r.resultado_liquido_brl >= 0 ? '#0aff39' : '#ff0a0a'),
      borderWidth: 1
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Desempenho Mensal (BRL)',
        color: '#e0e0e0',
        font: {
          size: 18,
          family: 'Sora',
          weight: '600' as const
        },
        align: 'start' as const,
        padding: {
          bottom: 24
        }
      },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Resultado: ${formatCurrency(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#e0e0e0',
          callback: (value: any) => 'R$ ' + value.toLocaleString('pt-BR')
        },
        grid: {
          color: 'rgba(212, 175, 55, 0.2)'
        }
      },
      x: {
        ticks: {
          color: '#e0e0e0'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div id="printable-report-area" className="space-y-6 animate-fade-in-up">
      <Card className="glass-card p-6">
        <div className="p-4 mb-4 text-sm rounded-lg bg-green-900/30 border border-green-500/50 text-green-100">
          <strong>✓ Cálculo atualizado conforme Lei 14.754/2023.</strong>
        </div>

        <h2 className="text-2xl mb-6 text-left">Resultados da Apuração</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6 text-center hover:shadow-lg transition-shadow">
            <p className="text-xs uppercase tracking-wider text-muted mb-2">Resultado Bruto (BRL)</p>
            <p className={`text-2xl ${kpi.totalBRL >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(kpi.totalBRL)}
            </p>
          </div>
          <div className="glass-card p-6 text-center hover:shadow-lg transition-shadow">
            <p className="text-xs uppercase tracking-wider text-muted mb-2">Resultado Bruto (USD)</p>
            <p className={`text-2xl ${kpi.totalUSD >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(kpi.totalUSD, 'USD')}
            </p>
          </div>
          <div className="glass-card p-6 text-center hover:shadow-lg transition-shadow">
            <p className="text-xs uppercase tracking-wider text-muted mb-2">Imposto Devido (15%)</p>
            <p className="text-2xl text-foreground">
              {formatCurrency(kpi.impostoAnual)}
            </p>
          </div>
          <div className="glass-card p-6 text-center hover:shadow-lg transition-shadow">
            <p className="text-xs uppercase tracking-wider text-muted mb-2">
              {kpi.resultadoAposDarf < 0 ? 'VALOR A COMPENSAR' : 'Resultado Líquido'}
            </p>
            <p className={`text-2xl ${kpi.resultadoAposDarf >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(kpi.resultadoAposDarf)}
            </p>
          </div>
        </div>

        <Card className="glass-card p-6 mb-8">
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-lg mb-4 text-left">Calendário Anual de Resultados</h3>
          <p className="text-sm mb-6 text-muted">
            Clique em um mês para ver suas operações detalhadas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthly.map(row => {
              const [year, monthNum] = row.mes.split('-');
              const monthName = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
              const isProfit = row.resultado_liquido_brl >= 0;

              return (
                <div
                  key={row.mes}
                  onClick={() => onMonthClick(row.mes, monthName)}
                  className={`glass-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
                    isProfit ? 'border-positive/30 hover:border-positive' : 'border-negative/30 hover:border-negative'
                  }`}
                >
                  <div className="text-sm mb-2 text-muted">{monthName}</div>
                  <div className={`mb-1 ${isProfit ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(row.resultado_liquido_usd, 'USD')}
                  </div>
                  <div className={`text-sm ${isProfit ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(row.resultado_liquido_brl)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-center mt-8">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={onExportClick}
          >
            <Download className="w-5 h-5" />
            <span>Exportar Relatório</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function TradesModal({ 
  monthName, 
  trades, 
  onClose 
}: { 
  monthName: string; 
  trades: ProcessedTrade[];
  onClose: () => void;
}) {
  // Bloquear scroll do body quando o modal está aberto
  useEffect(() => {
    // Salvar o valor atual do overflow
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calcular largura da scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Bloquear scroll e compensar a largura da scrollbar
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    // Restaurar quando o modal fechar
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const totalUSD = trades.reduce((sum, t) => sum + t.resultado_liquido_usd, 0);
  const totalBRL = trades.reduce((sum, t) => sum + t.resultado_liquido_brl, 0);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4 sm:p-6 overflow-auto"
      style={{ 
        backgroundColor: 'rgba(13, 13, 13, 0.8)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl my-auto"
        style={{
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: 'calc(100vh - 2rem)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-foreground">Operações de {monthName}</h2>
          <button
            onClick={onClose}
            className="text-2xl text-muted hover:text-foreground transition-colors"
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <div className="overflow-auto rounded-lg border border-border" style={{ background: 'var(--surface-card)', maxHeight: 'calc(100vh - 12rem)' }}>
          <table className="min-w-[500px] w-full divide-y divide-border text-[8px] sm:text-sm md:text-base">
            <thead className="bg-card/50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-center uppercase tracking-wider text-muted whitespace-nowrap">Data</th>
                <th className="px-2 sm:px-4 py-3 text-center uppercase tracking-wider text-muted whitespace-nowrap">Ativo</th>
                <th className="px-2 sm:px-4 py-3 text-center uppercase tracking-wider text-muted whitespace-nowrap">Resultado (USD)</th>
                <th className="px-2 sm:px-4 py-3 text-center uppercase tracking-wider text-muted whitespace-nowrap">Resultado (BRL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trades.map((trade, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-muted text-center">
                    {new Date(trade.data_iso + 'T00:00:00Z').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-center">
                    {trade.ativo || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`${trade.resultado_liquido_usd >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatCurrency(trade.resultado_liquido_usd, 'USD')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`${trade.resultado_liquido_brl >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatCurrency(trade.resultado_liquido_brl)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function IrResultsWrapper({ 
  kpi, 
  monthly, 
  platform,
  processedTrades,
  onMonthClick,
  isExportModalOpen,
  setIsExportModalOpen
}: { 
  kpi: IrKpiData; 
  monthly: MonthlyResult[];
  platform: string;
  processedTrades: ProcessedTrade[];
  onMonthClick: (mes: string, monthName: string) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
}) {
  const handleExport = async (options: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      await generateIrPdf(
        user.email || 'usuario',
        monthly,
        processedTrades,
        kpi,
        options
      );
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
      throw error;
    }
  };

  return (
    <>
      <IrResults 
        kpi={kpi}
        monthly={monthly}
        platform={platform}
        onMonthClick={onMonthClick}
        onExportClick={() => setIsExportModalOpen(true)}
      />
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="ir"
        onExport={handleExport}
      />
    </>
  );
}
