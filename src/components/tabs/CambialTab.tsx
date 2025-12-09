import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CompactCalendar } from '../CompactCalendar';
import { Edit2, Trash2, AlertCircle, Download, CalendarIcon } from 'lucide-react';
import { Transaction } from '../../lib/types';
import { fetchBcbRateForDate, getRateForDate } from '../../lib/api/bcb';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../../lib/utils/currency';
import { generateCambialPdf } from '../../lib/utils/pdf-export';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExportModal } from '../ExportModal';
import { auth } from '../../lib/firebase';
import { useApp } from '../../lib/context/AppContext';
import {
  ProcessedRow,
  CambialKpi,
  processAndRenderCambial
} from '../../lib/calculations/cambial';

export function CambialTab() {
  const { withdrawals, setWithdrawals } = useApp();

  // Generate a unique ID for transactions
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Convert context withdrawals (any[]) to Transaction[] with Date objects
  const transactions = useMemo(() => {
    return withdrawals.map(t => ({
      ...t,
      id: t.id || generateId(), // Ensure all transactions have IDs
      date: new Date(t.date)
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [withdrawals]);

  const setTransactions = (newTransactions: Transaction[]) => {
    setWithdrawals(newTransactions);
  };

  const [currentTransaction, setCurrentTransaction] = useState({
    date: '',
    type: 'Envio' as 'Envio' | 'Retirada' | 'Não Retirada',
    value: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateInputValue, setDateInputValue] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [results, setResults] = useState<{
    processed: ProcessedRow[];
    kpi: CambialKpi;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Get available years from all transactions
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear); // Always include current year

    transactions.forEach(t => {
      const year = t.date.getFullYear().toString();
      years.add(year);
    });

    return Array.from(years).sort().reverse();
  }, [transactions]);

  // Filter transactions by selected year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.getFullYear().toString() === selectedYear);
  }, [transactions, selectedYear]);

  // Sincronizar selectedDate com currentTransaction.date


  // Determina se "Não Retirada" deve estar habilitado (apenas em 31/12)
  const isNaoRetiradaEnabled = currentTransaction.date &&
    currentTransaction.date.substring(5) === '12-31';

  // Efeito para resetar o tipo se "Não Retirada" foi desabilitado
  useEffect(() => {
    if (!isNaoRetiradaEnabled && currentTransaction.type === 'Não Retirada') {
      setCurrentTransaction(prev => ({ ...prev, type: 'Envio' }));
    }
  }, [isNaoRetiradaEnabled, currentTransaction.type]);

  const handleAddTransaction = async () => {
    const dateValue = currentTransaction.date;

    if (!dateValue) {
      toast.error('Por favor, preencha a data.');
      return;
    }

    const validationDate = new Date(`${dateValue}T00:00:00Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (validationDate > today) {
      toast.error('A data não pode ser futura.');
      return;
    }

    const numericValue = parseCurrencyInput(currentTransaction.value);
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error('Por favor, preencha um valor positivo válido no formato 1.000,00.');
      return;
    }

    // Validação: primeira transação deve ser ENVIO
    if (transactions.length === 0 && (currentTransaction.type === 'Retirada' || currentTransaction.type === 'Não Retirada')) {
      toast.error('O primeiro lançamento deve ser obrigatoriamente um ENVIO.');
      return;
    }

    try {
      // Buscar cotação do BCB
      await fetchBcbRateForDate(validationDate.toISOString().split('T')[0]);

      // Get the cotação and store it with the transaction
      const cotacao = getRateForDate(validationDate, currentTransaction.type);

      const transactionData: Transaction = {
        id: editingId || generateId(),
        date: validationDate,
        type: currentTransaction.type,
        value: numericValue,
        cotacao: cotacao || undefined
      };

      let updatedTransactions: Transaction[];
      if (editingId !== null) {
        updatedTransactions = transactions.map(t =>
          t.id === editingId ? transactionData : t
        );
        toast.success('Transação atualizada com sucesso!');
      } else {
        updatedTransactions = [...transactions, transactionData];
        toast.success('Transação adicionada com sucesso!');
      }

      // Ordenar por data
      updatedTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
      setTransactions(updatedTransactions);
      cancelEdit();
    } catch (error: any) {
      toast.error(`Não foi possível buscar a cotação do dólar. Verifique sua conexão. Erro: ${error.message}`);
    }
  };

  const editTransaction = (id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (!trans) return;

    setEditingId(id);
    setCurrentTransaction({
      date: trans.date.toISOString().split('T')[0],
      type: trans.type,
      value: formatCurrencyInput(trans.value)
    });
    setSelectedDate(trans.date);
    setDateInputValue(format(trans.date, 'dd/MM/yyyy', { locale: ptBR }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCurrentTransaction({ date: '', type: 'Envio', value: '' });
    setSelectedDate(undefined);
    setDateInputValue('');
  };

  const removeTransaction = (id: string) => {
    if (confirm('Tem certeza que deseja remover este registro?')) {
      const filtered = transactions.filter(t => t.id !== id);
      setTransactions(filtered);
      toast.success('Transação removida com sucesso!');
    }
  };

  const handleProcess = async () => {
    if (filteredTransactions.length === 0) {
      toast.error(`Nenhum registro foi adicionado para ${selectedYear}.`);
      return;
    }

    setIsProcessing(true);
    try {
      // Garantir que todas as cotações foram buscadas
      const allDates = [...new Set(filteredTransactions.map(t => t.date.toISOString().split('T')[0]))];
      await Promise.all(allDates.map(date => fetchBcbRateForDate(date)));

      const result = processAndRenderCambial(filteredTransactions);
      setResults(result);
      toast.success('Dados processados com sucesso!');
    } catch (error: any) {
      toast.error(`Ocorreu um erro: ${error.message}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Year Selector */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Label className="text-foreground font-medium">Ano de Referência:</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 bg-input-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted">
            {filteredTransactions.length} registro(s) em {selectedYear}
          </p>
        </div>
      </Card>

      <Card className="glass-card p-6" data-tour="add-transaction">
        <h3 className="mb-4">Adicionar Transação de Capital</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Data</Label>
            <div className="relative">
              <Input
                placeholder="DD/MM/AAAA"
                value={dateInputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleaned = value.replace(/[^\d]/g, '');

                  let formatted = '';
                  if (cleaned.length > 0) formatted += cleaned.substring(0, 2);
                  if (cleaned.length >= 3) formatted += '/' + cleaned.substring(2, 4);
                  if (cleaned.length >= 5) formatted += '/' + cleaned.substring(4, 8);

                  setDateInputValue(formatted);

                  if (formatted.length === 10) {
                    const [day, month, year] = formatted.split('/').map(Number);
                    if (day && month && year && month <= 12 && day <= 31) {
                      const parsedDate = new Date(year, month - 1, day);
                      if (!isNaN(parsedDate.getTime()) && parsedDate <= new Date()) {
                        setSelectedDate(parsedDate);
                        setCurrentTransaction(prev => ({
                          ...prev,
                          date: format(parsedDate, 'yyyy-MM-dd')
                        }));
                        return;
                      }
                    }
                  }

                  // Se a data for inválida ou incompleta, limpar o estado interno
                  if (currentTransaction.date) {
                    setSelectedDate(undefined);
                    setCurrentTransaction(prev => ({ ...prev, date: '' }));
                  }
                }}
                className="bg-input-background border-border text-foreground pr-10"
              />
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-accent/10 transition-colors rounded-r-lg"
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-0 shadow-none bg-transparent"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  avoidCollisions={true}
                  collisionPadding={10}
                >
                  <CompactCalendar
                    selected={selectedDate}
                    onSelect={(date) => {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      setCurrentTransaction({ ...currentTransaction, date: formattedDate });
                      setSelectedDate(date);
                      setDateInputValue(format(date, 'dd/MM/yyyy', { locale: ptBR }));
                      setDatePickerOpen(false);
                    }}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="trans-type">Tipo</Label>
            <Select
              value={currentTransaction.type}
              onValueChange={(value: any) => setCurrentTransaction({ ...currentTransaction, type: value })}
            >
              <SelectTrigger className="bg-input-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Envio">Envio</SelectItem>
                <SelectItem value="Retirada">Retirada</SelectItem>
                <SelectItem value="Não Retirada" disabled={!isNaoRetiradaEnabled}>
                  Não Retirada
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="trans-value">Valor Líquido (USD)</Label>
            <Input
              id="trans-value"
              placeholder="1.000,00"
              value={currentTransaction.value}
              onChange={(e) => setCurrentTransaction({ ...currentTransaction, value: e.target.value })}
              className="bg-input-background border-border text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddTransaction}
              variant="secondary"
              className="flex-1"
            >
              {editingId !== null ? 'Salvar Alterações' : 'Adicionar +'}
            </Button>
            {editingId !== null && (
              <Button
                onClick={cancelEdit}
                variant="outline"
                className="flex-1 border-[#D4AF37] text-[#D4AF37]"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-black/20 border-l-4 border-[#D4AF37]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#D4AF37]">MUITO IMPORTANTE:</p>
              <p className="mt-1 text-sm text-muted">
                NÃO CONSIDERAR OU INFORMAR RETIRADAS DE LUCRO COM OS SEUS TRADES NESTE CAMPO.
                AQUI DEVE-SE INFORMAR SOMENTE O CAPITAL ORIGINALMENTE ENVIADO OU RETIRADO DO
                EXTERIOR (MARGEM PARA OPERAR).
              </p>
            </div>
          </div>
        </div>

        {filteredTransactions.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 border-t border-border pt-4">Registros de {selectedYear}:</h4>
            <div className="overflow-x-auto bg-background rounded-md border border-border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-center py-3 px-4">Data</th>
                    <th className="text-center py-3 px-4">Tipo</th>
                    <th className="text-center py-3 px-4">Valor (USD)</th>
                    <th className="text-center py-3 px-4">Cotação (BRL)</th>
                    <th className="text-center py-3 px-4">Total (R$)</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((trans) => {
                    // Use stored cotacao if available, otherwise try cache
                    const cotacao = trans.cotacao || getRateForDate(trans.date, trans.type);
                    const totalBRL = cotacao ? trans.value * cotacao : null;

                    return (
                      <tr key={trans.id}>
                        <td className="py-3 px-4 text-center">
                          {trans.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </td>
                        <td className="py-3 px-4 text-center">{trans.type}</td>
                        <td className="py-3 px-4 text-center">{formatCurrency(trans.value, 'USD')}</td>
                        <td className="py-3 px-4 text-center">
                          {cotacao ? formatCurrency(cotacao) : <span className="text-xs text-muted">Automático</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {totalBRL !== null ? formatCurrency(totalBRL) : <span className="text-xs text-muted">---</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => editTransaction(trans.id)}
                              className="text-muted hover:text-accent transition-colors p-1"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeTransaction(trans.id)}
                              className="text-muted hover:text-accent transition-colors p-1"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <div className="text-center" data-tour="process-cambial">
        <Button
          onClick={handleProcess}
          disabled={isProcessing || filteredTransactions.length === 0}
          className="bg-gradient-to-r from-[#D4AF37] via-[#FFEE99] to-[#D4AF37] bg-[length:150%_auto] text-[#0D0D0D] hover:bg-[length:250%_auto] transition-all duration-500"
        >
          {isProcessing ? 'Processando...' : `Processar Dados de ${selectedYear}`}
        </Button>
      </div>

      {results && (
        <CambialResultsWrapper
          kpi={results.kpi}
          processed={results.processed}
          isExportModalOpen={isExportModalOpen}
          setIsExportModalOpen={setIsExportModalOpen}
        />
      )}
    </div>
  );
}



function CambialResults({ kpi, processed, onExportClick }: { kpi: CambialKpi, processed: ProcessedRow[], onExportClick: () => void }) {
  const kpiCards: { title: string; value: string; color: string; span?: 'full' }[] = [];

  // Se houver "Não Retirada" em 31/12, mostrar card de "Alocar para Próximo Ano"
  if (kpi.mostrarAlocarCard) {
    kpiCards.push({
      title: 'Alocar para Próximo Ano',
      value: formatCurrency(kpi.saldoFinalParaExibir),
      color: 'text-accent',
      span: 'full'
    });
  }

  const corNaoIsenta = kpi.lucroTributavel >= 0 ? 'text-positive' : 'text-negative';

  kpiCards.push(
    { title: 'Variação Cambial Total', value: formatCurrency(kpi.lucroPrejuizoTotal), color: kpi.lucroPrejuizoTotal >= 0 ? 'text-positive' : 'text-negative' },
    { title: 'Variação Cambial Não Isenta', value: formatCurrency(kpi.lucroTributavel), color: corNaoIsenta },
    { title: 'Imposto a Pagar (15%)', value: formatCurrency(kpi.impostoDevido), color: 'text-negative' },
    { title: 'Total Enviado (USD)', value: formatCurrency(kpi.totalEnviosUSD, 'USD'), color: 'text-foreground' },
    { title: 'Total Retirado (USD)', value: formatCurrency(kpi.totalRetiradoUSD, 'USD'), color: 'text-foreground' },
    { title: 'Saldo Atual (USD)', value: formatCurrency(kpi.saldoUSD, 'USD'), color: 'text-foreground' },
    { title: 'Total Enviado (BRL)', value: formatCurrency(kpi.totalEnviosBRL), color: 'text-foreground' },
    { title: 'Total Retirado (BRL)', value: formatCurrency(kpi.totalRetiradoBRL), color: 'text-foreground' },
    { title: 'Saldo Atual (BRL)', value: formatCurrency(kpi.saldoFinalParaExibir), color: 'text-accent' }
  );

  return (
    <div id="pdf-export-cambial" className="space-y-6 animate-fade-in-up">
      <h3 className="text-xl text-left">Resumo da Movimentação Cambial</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => (
          <div
            key={index}
            className={`glass-card p-6 text-center hover:shadow-lg transition-shadow ${kpi.span === 'full' ? 'md:col-span-3' : ''}`}
          >
            <p className="text-xs uppercase tracking-wider text-muted mb-2">{kpi.title}</p>
            <p className={`text-2xl ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <Card className="glass-card p-6">
        <h3 className="mb-4 text-left">Extrato Detalhado</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-center py-3 px-4">Data</th>
                <th className="text-center py-3 px-4">Tipo</th>
                <th className="text-center py-3 px-4">Valor (USD)</th>
                <th className="text-center py-3 px-4">Cotação (BRL)</th>
                <th className="text-center py-3 px-4">Valor (BRL)</th>
                <th className="text-center py-3 px-4">Lucro/Prejuízo Cambial (BRL)</th>
                <th className="text-center py-3 px-4">Saldo Final (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processed.map((row, index) => (
                <tr key={index}>
                  <td className="text-center py-4 px-4 whitespace-nowrap">
                    {row.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{row.type}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.valueUSD, 'USD')}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.cotacao)}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.valueBRL)}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">
                    <span className={row.lucroPrejuizo >= 0 ? 'text-positive font-semibold' : 'text-negative font-semibold'}>
                      {formatCurrency(row.lucroPrejuizo)}
                    </span>
                  </td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.saldoFinal, 'USD')}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}

function CambialResultsWrapper({
  processed,
  kpi,
  isExportModalOpen,
  setIsExportModalOpen
}: {
  processed: ProcessedRow[];
  kpi: CambialKpi;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
}) {
  const handleExport = async (options: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast('Usuário não autenticado', {
          description: 'Faça login para exportar relatórios',
          duration: 3000
        });
        return;
      }

      // Prepara os dados para exportação
      const exportData = {
        headers: ['Data', 'Tipo', 'Valor (USD)', 'Cotação (BRL)', 'Valor (BRL)', 'Lucro/Prejuízo Cambial (BRL)', 'Saldo Final (USD)'],
        data: processed.map(row => ({
          date: row.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          type: row.type,
          valueUSD: row.valueUSD,
          cotacao: row.cotacao,
          valueBRL: row.valueBRL,
          lucroPrejuizo: row.lucroPrejuizo,
          saldoFinal: row.saldoFinal
        }))
      };

      await generateCambialPdf(
        user.email || 'usuario',
        kpi,
        exportData,
        options
      );

      toast('PDF gerado com sucesso!', {
        description: 'O arquivo foi baixado',
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast('Erro ao gerar PDF', {
        description: 'Tente novamente',
        duration: 3000
      });
      throw error;
    }
  };

  return (
    <>
      <CambialResults
        processed={processed}
        kpi={kpi}
        onExportClick={() => setIsExportModalOpen(true)}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="cambial"
        onExport={handleExport}
      />
    </>
  );
}
