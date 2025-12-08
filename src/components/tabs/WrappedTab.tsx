import * as React from 'react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../lib/utils/currency';
import { useApp } from '../../lib/context/AppContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '../ui/carousel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Logo } from '../Logo';
import styles from './WrappedTab.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Hook para efeitos 3D do carrossel circular
function useCarousel3dOffsets(
  api: CarouselApi | undefined,
  cardRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>,
  cardCount: number
) {
  const rafIdRef = useRef<number>();
  const MAX_VISIBILITY = 3;

  useEffect(() => {
    if (!api || cardCount === 0) return;

    const updateOffsets = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const selectedIndex = api.selectedScrollSnap();

        // Calculate the center position in the scroll timeline
        // Embla scroll progress goes from 0 to 1 (or more if looping)
        // We need to map this to card indices

        for (let i = 0; i < cardCount; i++) {
          const element = cardRefs.current[i];
          if (!element) continue;

          // Embla's internal engine handles the loop logic, but for visual effects
          // we need to calculate the distance from the "center" of the view.
          // The simplest way with Embla is to check the distance to the selected snap.

          let offset = i - selectedIndex;

          // Adjust for loop
          if (offset > cardCount / 2) offset -= cardCount;
          else if (offset < -cardCount / 2) offset += cardCount;

          const absOffset = Math.abs(offset);
          const isVisible = absOffset < MAX_VISIBILITY;

          // 3D Effect Parameters
          const scale = Math.max(0.8, 1 - absOffset * 0.15); // Scale down further cards
          const opacity = Math.max(0.3, 1 - absOffset * 0.5); // Fade out further cards
          const blur = absOffset * 4; // Increase blur for further cards
          const zIndex = 10 - Math.round(absOffset);
          const rotateY = offset * -15; // Rotate slightly
          const translateX = offset * 40; // Overlap cards slightly

          if (isVisible) {
            element.style.transform = `perspective(1000px) rotateY(${rotateY}deg) translateX(${translateX}px) scale(${scale})`;
            element.style.opacity = String(opacity);
            element.style.filter = `blur(${blur}px)`;
            element.style.zIndex = String(zIndex);
            element.style.visibility = 'visible';
          } else {
            element.style.visibility = 'hidden';
          }
        }
      });
    };

    api.on('select', updateOffsets);
    api.on('scroll', updateOffsets);
    api.on('reInit', updateOffsets);

    updateOffsets();

    return () => {
      api.off('select', updateOffsets);
      api.off('scroll', updateOffsets);
      api.off('reInit', updateOffsets);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [api, cardRefs]);
}


export function WrappedTab() {
  const { processedTrades: allTrades } = useApp();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({}); // Para efeitos 3D

  // Year Filter Logic
  const years = useMemo(() => {
    if (!allTrades.length) return [new Date().getFullYear().toString()];
    const uniqueYears = Array.from(new Set(allTrades.map(t => t.mes_ano.split('-')[0]))).sort().reverse();
    return uniqueYears.length ? uniqueYears : [new Date().getFullYear().toString()];
  }, [allTrades]);

  const [selectedYear, setSelectedYear] = useState<string>(years[0]);

  // Update selected year if available years change
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const processedTrades = useMemo(() => {
    return allTrades.filter(t => t.mes_ano.startsWith(selectedYear));
  }, [allTrades, selectedYear]);

  // Monitor carousel changes
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Aplica efeitos 3D no carrossel circular
  useCarousel3dOffsets(api, cardRefs, 7); // 7 cards no total

  if (!allTrades || allTrades.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <div className="glass-card p-8 max-w-md mx-auto border-2 border-accent/30">
          <Logo className="h-16 w-auto mx-auto mb-6" />
          <h3 className="text-xl text-accent mb-3">Nenhum Dado Disponível</h3>
          <p className="text-muted">
            Importe seus trades para visualizar o XTraders Report 2024
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics (usando campos corretos do Trade)
  const winningTrades = processedTrades.filter(t => t.resultado_liquido_brl > 0);
  const losingTrades = processedTrades.filter(t => t.resultado_liquido_brl < 0);

  const stats: any = {
    netResult: processedTrades.reduce((sum, t) => sum + t.resultado_liquido_brl, 0),
    netResultUSD: processedTrades.reduce((sum, t) => sum + t.resultado_liquido_usd, 0),
    totalTrades: processedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / processedTrades.length) * 100,
    biggestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.resultado_liquido_brl)) : 0,
    biggestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.resultado_liquido_brl)) : 0,
    avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.resultado_liquido_brl, 0) / winningTrades.length : 0,
    avgLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.resultado_liquido_brl, 0) / losingTrades.length : 0,
  };
  stats.profitFactor = Math.abs(stats.avgLoss) > 0 ? stats.avgWin / Math.abs(stats.avgLoss) : 0;

  // Análise mensal (usando mes_ano do Trade)
  const monthlyResults: { [key: string]: { profit: number; trades: number; wins: number } } = {};
  processedTrades.forEach(trade => {
    if (!monthlyResults[trade.mes_ano]) {
      monthlyResults[trade.mes_ano] = { profit: 0, trades: 0, wins: 0 };
    }
    monthlyResults[trade.mes_ano].profit += trade.resultado_liquido_brl;
    monthlyResults[trade.mes_ano].trades++;
    if (trade.resultado_liquido_brl > 0) monthlyResults[trade.mes_ano].wins++;
  });

  const sortedMonths = Object.keys(monthlyResults).sort();
  const bestMonthKey = sortedMonths.reduce((a, b) => monthlyResults[a].profit > monthlyResults[b].profit ? a : b, sortedMonths[0]);
  const worstMonthKey = sortedMonths.reduce((a, b) => monthlyResults[a].profit < monthlyResults[b].profit ? a : b, sortedMonths[0]);

  // Formatar mês/ano para exibição
  const formatMonthYear = (mesAno: string) => {
    if (!mesAno) return 'N/A';
    const [year, month] = mesAno.split('-');
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  stats.monthlyData = sortedMonths.map(key => ({
    month: formatMonthYear(key),
    profit: monthlyResults[key].profit,
    trades: monthlyResults[key].trades,
    wins: monthlyResults[key].wins
  }));
  stats.activeMonths = sortedMonths.length;
  stats.bestMonth = { month: formatMonthYear(bestMonthKey), profit: monthlyResults[bestMonthKey]?.profit || 0 };
  stats.worstMonth = { month: formatMonthYear(worstMonthKey), profit: monthlyResults[worstMonthKey]?.profit || 0 };

  // Análise por ativo (usando campo 'ativo')
  const assetStats: { [key: string]: { profit: number; trades: number; wins: number } } = {};
  processedTrades.forEach(trade => {
    if (!assetStats[trade.ativo]) {
      assetStats[trade.ativo] = { profit: 0, trades: 0, wins: 0 };
    }
    assetStats[trade.ativo].profit += trade.resultado_liquido_brl;
    assetStats[trade.ativo].trades++;
    if (trade.resultado_liquido_brl > 0) assetStats[trade.ativo].wins++;
  });

  stats.topAssets = Object.entries(assetStats)
    .sort(([, a], [, b]) => b.profit - a.profit)
    .slice(0, 5)
    .map(([symbol, data]) => ({
      symbol,
      profit: data.profit,
      trades: data.trades
    }));

  // Helper to wrap cards for UI scaling
  const CardWrapper = ({ children, index }: { children: React.ReactNode, index: number }) => (
    <div className="h-full flex items-center justify-center py-10">
      <div
        ref={(el) => (cardRefs.current[index] = el)}
        className="transition-all duration-500 ease-out origin-center"
        style={{ willChange: 'transform, opacity, filter' }}
      >
        {/* Scale down the visual representation in the UI */}
        <div className="transform scale-[0.65] sm:scale-[0.75] origin-center">
          {children}
        </div>
      </div>
    </div>
  );

  const cards = [
    // === CARD 1: XTRADERS (INTRO) - Design do Print ===
    <CardWrapper index={0} key="intro">
      <div className="w-[540px] h-[800px] bg-[#0D0D0D] rounded-[43px] border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col items-center justify-between py-20 px-8 relative">
        {/* XTRADERS no topo */}
        <div className="text-center relative z-20">
          <h3 className="font-['Sora',sans-serif] font-bold text-[24px] text-white tracking-[8px] uppercase">
            XTRADERS
          </h3>
        </div>

        {/* Logo X gigante no centro com efeito de brilho */}
        <div className="flex-1 flex items-center justify-center relative w-full">
          {/* Glow effect atrás do logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[400px] h-[400px] blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.1) 50%, transparent 100%)'
              }}
            ></div>
          </div>
          {/* Logo X com gradiente dourado */}
          <Logo className="h-[350px] w-auto relative z-10" />
        </div>

        {/* REPORT embaixo */}
        <div className="text-center relative z-20">
          <h3 className="font-['Sora',sans-serif] font-bold text-[28px] text-white tracking-[8px] uppercase">
            REPORT
          </h3>
        </div>

      </div>
    </CardWrapper>,

    // === CARD 2: VISÃO GERAL ===
    <CardWrapper index={1} key="overview">
      <div className="w-[540px] h-[800px] bg-[#0D0D0D] rounded-[43px] border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col p-8">
        {/* Título */}
        <div className="text-center mt-6 mb-auto">
          <h3 className="font-['Sora',sans-serif] font-bold text-[16px] text-white tracking-[3px] uppercase">
            VISÃO GERAL
          </h3>
        </div>

        {/* Resultado Líquido Anual */}
        <div className="text-center mb-auto">
          <div className="font-['Sora',sans-serif] font-semibold text-[11px] text-[#999] tracking-[1px] mb-4 uppercase">
            Resultado Líquido Anual
          </div>
          <div className={`font-['Sora',sans-serif] font-extrabold text-[52px] tracking-tight leading-none ${stats.netResult >= 0 ? 'text-[#0aff39]' : 'text-[#ff0a0a]'
            }`}>
            {formatCurrency(stats.netResult)}
          </div>
        </div>

        {/* Duas métricas lado a lado */}
        <div className="grid grid-cols-2 gap-5 mb-auto">
          <div className="bg-[#1A1A1A] rounded-[20px] border border-[#333] p-6 text-center">
            <div className="font-['Sora',sans-serif] font-extrabold text-[52px] text-white tracking-tight leading-none mb-2">
              {stats.totalTrades}
            </div>
            <div className="font-['Sora',sans-serif] font-medium text-[11px] text-[#999] tracking-[0.5px] uppercase">
              Total Trades
            </div>
          </div>
          <div className="bg-[#1A1A1A] rounded-[20px] border border-[#333] p-6 text-center">
            <div className="font-['Sora',sans-serif] font-extrabold text-[52px] text-white tracking-tight leading-none mb-2">
              {stats.activeMonths}
            </div>
            <div className="font-['Sora',sans-serif] font-medium text-[11px] text-[#999] tracking-[0.5px] uppercase">
              Meses Ativos
            </div>
          </div>
        </div>

        {/* Logo X embaixo */}
        <div className="flex justify-center pb-4">
          <Logo className="h-[60px] w-auto opacity-[0.15]" />
        </div>
      </div>
    </CardWrapper>,

    // === CARD 3: PERFORMANCE (FUNDO AMARELO) ===
    <CardWrapper index={2} key="performance">
      <div className="w-[540px] h-[800px] bg-[#D4AF37] rounded-[43px] border-2 border-[#B8951C] overflow-hidden shadow-2xl flex flex-col p-8">
        {/* Título */}
        <div className="text-center mt-6 mb-auto">
          <h3 className="font-['Sora',sans-serif] font-bold text-[16px] text-[#1A1A1A] tracking-[3px] uppercase">
            PERFORMANCE
          </h3>
        </div>

        {/* Grid 2x2 de métricas */}
        <div className="grid grid-cols-2 gap-5 mb-auto">
          <div className="bg-[#1A1A1A] rounded-[20px] border-2 border-[#2A2A2A] flex flex-col items-center justify-center py-8">
            <div className="font-['Sora',sans-serif] font-medium text-[11px] text-[#666] tracking-[0.5px] mb-3 uppercase">
              Taxa Acerto
            </div>
            <div className="font-['Sora',sans-serif] font-extrabold text-[46px] text-white tracking-tight leading-none">
              {stats.winRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-[#1A1A1A] rounded-[20px] border-2 border-[#2A2A2A] flex flex-col items-center justify-center py-8">
            <div className="font-['Sora',sans-serif] font-medium text-[11px] text-[#666] tracking-[0.5px] mb-3 uppercase">
              Trades
            </div>
            <div className="font-['Sora',sans-serif] font-extrabold text-[46px] text-white tracking-tight leading-none">
              {stats.totalTrades}
            </div>
          </div>
          <div className="bg-[#1A1A1A] rounded-[20px] border-2 border-[#2A2A2A] flex flex-col items-center justify-center py-8">
            <div className="font-['Sora',sans-serif] font-medium text-[11px] text-[#666] tracking-[0.5px] mb-3 uppercase">
              Média Ganho
            </div>
            <div className="font-['Sora',sans-serif] font-extrabold text-[36px] text-white tracking-tight leading-none">
              {formatCurrency(stats.avgWin)}
            </div>
          </div>
          <div className="bg-[#1A1A1A] rounded-[20px] border-2 border-[#2A2A2A] flex flex-col items-center justify-center py-8">
            <div className="font-['Sora',sans-serif] font-medium text-[11px] text-[#666] tracking-[0.5px] mb-3 uppercase">
              Média Perda
            </div>
            <div className="font-['Sora',sans-serif] font-extrabold text-[36px] text-white tracking-tight leading-none">
              {formatCurrency(stats.avgLoss)}
            </div>
          </div>
        </div>

        {/* Logo X embaixo (preto para contrastar com amarelo) */}
        <div className="flex justify-center pb-4">
          <div className="opacity-20 brightness-0">
            <Logo className="h-[60px] w-auto" />
          </div>
        </div>
      </div>
    </CardWrapper>,

    // === CARD 4: TOP 5 ATIVOS ===
    <CardWrapper index={3} key="top-assets">
      <div className="w-[540px] h-[800px] bg-[#0D0D0D] rounded-[43px] border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col p-8">
        {/* Título */}
        <div className="text-center mt-6 mb-12">
          <h3 className="font-['Sora',sans-serif] font-bold text-[16px] text-white tracking-[3px] uppercase">
            TOP 5 ATIVOS
          </h3>
        </div>

        {/* Lista de Ativos */}
        <div className="flex-1 flex flex-col justify-center space-y-5">
          {stats.topAssets.map((asset: any, index: number) => (
            <div
              key={index}
              className={`h-[105px] rounded-[24px] flex items-center justify-between px-7 transition-all shadow-lg ${index === 0
                ? 'bg-gradient-to-r from-[rgba(212,175,55,0.25)] via-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] border-2 border-[#d4af37]'
                : 'bg-gradient-to-r from-[rgba(240,240,240,0.08)] to-[rgba(240,240,240,0.02)] border-2 border-[#9c7b0e]'
                }`}
            >
              <div className="flex items-center gap-5">
                <div className={`flex items-center justify-center w-16 h-16 rounded-full font-['Sora',sans-serif] font-extrabold text-lg ${index === 0 ? 'bg-[#d4af37] text-[#191919]' : 'bg-[rgba(212,175,55,0.2)] text-[#d4af37] border-2 border-[rgba(212,175,55,0.4)]'
                  }`}>
                  #{index + 1}
                </div>
                <div className={`font-['Sora',sans-serif] font-extrabold text-[28px] ${index === 0 ? 'text-[#d4af37]' : 'text-white'
                  }`}>
                  {asset.symbol}
                </div>
              </div>
              <div className={`font-['Sora',sans-serif] font-extrabold text-[24px] ${asset.profit >= 0 ? 'text-[#0aff39]' : 'text-[#ff0a0a]'
                }`}>
                {formatCurrency(asset.profit)}
              </div>
            </div>
          ))}
        </div>

        {/* Logo X embaixo */}
        <div className="flex justify-center mt-auto pb-4">
          <Logo className="h-[60px] w-auto opacity-[0.12]" />
        </div>
      </div>
    </CardWrapper>,

    // === CARD 5: EVOLUÇÃO MENSAL ===
    <CardWrapper index={4} key="monthly">
      <div className="w-[540px] h-[800px] bg-[#0D0D0D] rounded-[43px] border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col p-8">
        {/* Título */}
        <div className="text-center mt-6 mb-10">
          <h3 className="font-['Sora',sans-serif] font-bold text-[16px] text-white tracking-[3px] uppercase">
            EVOLUÇÃO MENSAL
          </h3>
        </div>

        {/* Gráfico */}
        <div className="flex-shrink-0 mb-10">
          <div className="w-full h-[280px] bg-gradient-to-br from-[rgba(18,18,18,0.6)] to-[rgba(18,18,18,0.3)] rounded-[24px] border-2 border-[#9c7b0e] p-6 shadow-lg">
            <Line
              data={{
                labels: stats.monthlyData.map((m: any) => m.month),
                datasets: [{
                  data: stats.monthlyData.map((m: any) => m.profit),
                  borderColor: '#D4AF37',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  fill: true,
                  tension: 0.4,
                  borderWidth: 3,
                  pointBackgroundColor: '#D4AF37',
                  pointBorderColor: '#191919',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  pointHoverRadius: 8
                }]
              }}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 12,
                    titleFont: { size: 12 },
                    bodyFont: { size: 14 },
                    displayColors: false,
                    callbacks: {
                      label: (context) => formatCurrency(context.parsed.y || 0)
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      color: '#FFFFFF80',
                      font: { size: 11 },
                      callback: (value: any) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    border: { display: false }
                  },
                  x: {
                    ticks: { color: '#FFFFFF80', font: { size: 11 } },
                    grid: { display: false },
                    border: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Melhor/Pior Mês Grid */}
        <div className="grid grid-cols-2 gap-5 mb-auto">
          {/* Melhor Mês */}
          <div className="bg-gradient-to-br from-[rgba(10,255,57,0.2)] to-[rgba(10,255,57,0.05)] rounded-[24px] border-2 border-[rgba(10,255,57,0.4)] flex flex-col items-center justify-center py-8 px-4 shadow-lg">
            <div className="font-['Sora',sans-serif] font-bold text-[14px] text-[#b3b3b3] tracking-[0.5px] mb-3 uppercase">
              Melhor Mês
            </div>
            <div className="font-['Sora',sans-serif] font-bold text-[20px] text-[#d4af37] tracking-wider mb-3">
              {stats.bestMonth.month}
            </div>
            <div className="font-['Sora',sans-serif] font-extrabold text-[28px] text-[#0aff39] tracking-tight leading-tight">
              {formatCurrency(stats.bestMonth.profit)}
            </div>
          </div>

          {/* Pior Mês */}
          <div className="bg-gradient-to-br from-[rgba(255,10,10,0.2)] to-[rgba(255,10,10,0.05)] rounded-[24px] border-2 border-[rgba(255,10,10,0.4)] flex flex-col items-center justify-center py-8 px-4 shadow-lg">
            <div className="font-['Sora',sans-serif] font-bold text-[14px] text-[#b3b3b3] tracking-[0.5px] mb-3 uppercase">
              Pior Mês
            </div>
            <div className="font-['Sora',sans-serif] font-bold text-[20px] text-[#d4af37] tracking-wider mb-3">
              {stats.worstMonth.month}
            </div>
            <div className="font-['Sora',sans-serif] font-extrabold text-[28px] text-[#ff0a0a] tracking-tight leading-tight">
              {formatCurrency(stats.worstMonth.profit)}
            </div>
          </div>
        </div>

        {/* Logo X embaixo */}
        <div className="flex justify-center mt-6 pb-4">
          <Logo className="h-[60px] w-auto opacity-[0.12]" />
        </div>
      </div>
    </CardWrapper>,

    // === CARD 6: MÊS A MÊS (MELHOR ATIVO POR MÊS) ===
    <CardWrapper index={5} key="month-by-month">
      <div className="w-[540px] h-[800px] bg-[#0D0D0D] rounded-[43px] border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col p-8">
        {/* Título */}
        <div className="text-center mt-4 mb-8">
          <h3 className="font-['Sora',sans-serif] font-bold text-[16px] text-white tracking-[3px] uppercase">
            MÊS A MÊS
          </h3>
        </div>

        {/* Grid de meses - SEM SCROLL */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-3 w-full">
            {sortedMonths.map((monthKey) => {
              const monthlyTrades = processedTrades.filter(t => t.mes_ano === monthKey);

              // Agrupar trades por ativo e somar os resultados
              const assetProfitInMonth: { [key: string]: number } = {};
              monthlyTrades.forEach(trade => {
                if (!assetProfitInMonth[trade.ativo]) {
                  assetProfitInMonth[trade.ativo] = 0;
                }
                assetProfitInMonth[trade.ativo] += trade.resultado_liquido_brl;
              });

              // Encontrar o ativo com maior lucro agregado (mesmo que seja negativo)
              let bestAsset = { symbol: 'N/A', profit: -Infinity };
              Object.entries(assetProfitInMonth).forEach(([symbol, profit]) => {
                if (profit > bestAsset.profit) {
                  bestAsset = { symbol, profit };
                }
              });

              const [, monthNum] = monthKey.split('-');
              const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
              const monthLabel = monthNames[parseInt(monthNum) - 1];

              return (
                <div key={monthKey} className="bg-gradient-to-br from-[rgba(18,18,18,0.8)] to-[rgba(18,18,18,0.4)] rounded-[16px] border-2 border-[#9c7b0e] p-3 text-center shadow-lg">
                  <div className="font-['Sora',sans-serif] font-bold text-[11px] text-[#d4af37] tracking-wide mb-1.5">
                    {monthLabel}
                  </div>
                  <div className="font-['Sora',sans-serif] font-extrabold text-[15px] text-white mb-1.5 truncate">
                    {bestAsset.symbol}
                  </div>
                  <div className={`font-['Sora',sans-serif] font-bold text-[12px] ${bestAsset.profit >= 0 ? 'text-[#0aff39]' : 'text-[#ff0a0a]'
                    }`}>
                    {formatCurrency(bestAsset.profit)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logo X embaixo */}
        <div className="flex justify-center mt-4 pb-4">
          <Logo className="h-[50px] w-auto opacity-[0.15]" />
        </div>
      </div>
    </CardWrapper>,

    // === CARD 7: XTRADERS REPORT (FINAL SUMMARY) ===
    <CardWrapper index={6} key="final-summary">
      <div className="w-[540px] h-[800px] bg-[#0D0D0D] rounded-[43px] border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col p-8">
        {/* XTRADERS no topo */}
        <div className="text-center mt-6 mb-8">
          <h3 className="font-['Sora',sans-serif] font-bold text-[16px] text-white tracking-[3px] uppercase">
            XTRADERS
          </h3>
        </div>

        {/* Resultado Líquido Anual */}
        <div className="text-center mb-10">
          <div className="font-['Sora',sans-serif] font-semibold text-[11px] text-[#999] tracking-[1px] mb-3 uppercase">
            Resultado Líquido Anual
          </div>
          <div className={`font-['Sora',sans-serif] font-extrabold text-[44px] tracking-tight leading-none ${stats.netResult >= 0 ? 'text-[#0aff39]' : 'text-[#ff0a0a]'
            }`}>
            {formatCurrency(stats.netResult)}
          </div>
        </div>

        {/* Grid 2x2 de métricas */}
        <div className="grid grid-cols-2 gap-5 mb-10">
          <div className="bg-[#1A1A1A] rounded-[18px] border border-[#333] flex flex-col items-center justify-center py-6">
            <div className="font-['Sora',sans-serif] font-extrabold text-[40px] text-white tracking-tight leading-none mb-1">
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="font-['Sora',sans-serif] font-medium text-[10px] text-[#999] tracking-[0.5px] uppercase">
              Taxa de Acerto
            </div>
          </div>
          <div className="bg-[#1A1A1A] rounded-[18px] border border-[#333] flex flex-col items-center justify-center py-6">
            <div className="font-['Sora',sans-serif] font-extrabold text-[40px] text-white tracking-tight leading-none mb-1">
              {stats.totalTrades}
            </div>
            <div className="font-['Sora',sans-serif] font-medium text-[10px] text-[#999] tracking-[0.5px] uppercase">
              Total Trades
            </div>
          </div>
          <div className="bg-[#1A1A1A] rounded-[18px] border border-[#333] flex flex-col items-center justify-center py-6">
            <div className="font-['Sora',sans-serif] font-extrabold text-[40px] text-white tracking-tight leading-none mb-1">
              {stats.profitFactor.toFixed(2)}
            </div>
            <div className="font-['Sora',sans-serif] font-medium text-[10px] text-[#999] tracking-[0.5px] uppercase">
              Profit Factor
            </div>
          </div>
          <div className="bg-[#1A1A1A] rounded-[18px] border border-[#333] flex flex-col items-center justify-center py-6">
            <div className="font-['Sora',sans-serif] font-extrabold text-[40px] text-white tracking-tight leading-none mb-1">
              {stats.activeMonths}
            </div>
            <div className="font-['Sora',sans-serif] font-medium text-[10px] text-[#999] tracking-[0.5px] uppercase">
              Meses Ativos
            </div>
          </div>
        </div>

        {/* Gráfico completo (igual ao card 5) */}
        <div className="flex-shrink-0 mb-6">
          <div className="w-full h-[200px] bg-gradient-to-br from-[rgba(18,18,18,0.6)] to-[rgba(18,18,18,0.3)] rounded-[24px] border-2 border-[#9c7b0e] p-4 shadow-lg">
            <Line
              data={{
                labels: stats.monthlyData.map((m: any) => m.month),
                datasets: [{
                  data: stats.monthlyData.map((m: any) => m.profit),
                  borderColor: '#D4AF37',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  fill: true,
                  tension: 0.4,
                  borderWidth: 3,
                  pointBackgroundColor: '#D4AF37',
                  pointBorderColor: '#191919',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 7
                }]
              }}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 10,
                    titleFont: { size: 11 },
                    bodyFont: { size: 12 },
                    displayColors: false,
                    callbacks: {
                      label: (context) => formatCurrency(context.parsed.y || 0)
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      color: '#FFFFFF80',
                      font: { size: 9 },
                      callback: (value: any) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    border: { display: false }
                  },
                  x: {
                    ticks: { color: '#FFFFFF80', font: { size: 9 } },
                    grid: { display: false },
                    border: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* REPORT embaixo */}
        <div className="text-center pb-4">
          <h3 className="font-['Sora',sans-serif] font-bold text-[22px] text-white tracking-[4px] uppercase">
            REPORT
          </h3>
        </div>
      </div>
    </CardWrapper>
  ];

  return (
    <section className="min-h-screen bg-transparent py-12 px-4 animate-fade-in-up">
      {/* Header Layer */}
      <header className="text-center mb-12 relative z-50">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
          <h1 className="font-['Sora',sans-serif] font-extrabold text-[32px] sm:text-[40px] bg-gradient-to-r from-[#D4AF37] via-[#F4E5B8] to-[#D4AF37] bg-clip-text text-transparent tracking-tight">
            XTRADERS REPORT
          </h1>
          <div className="w-32">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#333] text-[#D4AF37] font-['Sora',sans-serif] font-bold h-10 rounded-full px-4">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#333]">
                {years.map(year => (
                  <SelectItem key={year} value={year} className="text-white hover:bg-[#333] focus:bg-[#333] cursor-pointer font-['Sora',sans-serif]">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="font-['Sora',sans-serif] text-[14px] text-[#999] tracking-wide">
          Seu ano em números • Navegue pelos cards em formato stories
        </p>
      </header>

      {/* Main Carousel Stage */}
      <main className="relative mx-auto w-full max-w-[1400px] px-8">
        {/* Left side blur fade */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0D0D0D] to-transparent z-10 pointer-events-none" />

        {/* Right side blur fade */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0D0D0D] to-transparent z-10 pointer-events-none" />
        <Carousel
          opts={{
            align: "center",
            loop: true,
            slidesToScroll: 1,
          }}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent className={`-ml-0 ${styles.carousel3dContainer}`}>
            {cards.map((card, index) => (
              <CarouselItem key={index} className="pl-0 basis-full">
                <div
                  ref={(el: HTMLDivElement | null) => (cardRefs.current[index] = el)}
                  className={`flex justify-center ${styles.carousel3dCard}`}
                >
                  {card}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Gold pill navigation buttons */}
          <CarouselPrevious className="absolute -left-16 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-2 border-[#D4AF37] bg-[#191919] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0D0D0D] transition-all shadow-lg" />
          <CarouselNext className="absolute -right-16 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-2 border-[#D4AF37] bg-[#191919] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0D0D0D] transition-all shadow-lg" />
        </Carousel>

        {/* Progress dots - centered with 6px spacing */}
        <div className="flex justify-center items-center gap-1.5 mt-8">
          {Array.from({ length: count }).map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all ${idx === current
                ? 'h-2 w-8 bg-[#D4AF37]'
                : 'h-2 w-2 bg-[#D4AF37]/30'
                }`}
            />
          ))}
        </div>

        <div className="text-center mt-3">
          <span className="font-['Sora',sans-serif] text-[12px] text-[#666] tracking-wider">
            {current + 1} de {count}
          </span>
        </div>
      </main>

    </section>
  );
}



